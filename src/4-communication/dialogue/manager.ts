/**
 * MDS v5 Phase 6 - Dialogue System
 * Branching conversations with choices and conditions
 *
 * Design principles:
 * - Dialogue trees are graph structures (nodes + edges)
 * - Choices can have conditions (emotion, memory, relationships)
 * - Dialogues can be player-driven or AI-driven
 * - State is tracked per entity
 *
 * v5.2: Uses DialogueParticipant to avoid circular dependency with Entity
 */

import type { DialogueParticipant } from '../types'

/**
 * Dialogue choice
 */
export interface DialogueChoice {
  id: string
  text: string
  nextNodeId: string
  condition?: (speaker: DialogueParticipant, listener: DialogueParticipant) => boolean
  emotion?: {
    valence?: number    // -1..1
    arousal?: number    // 0..1
    dominance?: number  // 0..1
  }
  metadata?: Record<string, any>
}

/**
 * Dialogue node
 */
export interface DialogueNode {
  id: string
  speaker?: 'self' | 'other'  // undefined = narrator
  text: string | ((speaker: DialogueParticipant, listener: DialogueParticipant) => string)
  choices?: DialogueChoice[]
  autoAdvance?: {
    delay: number         // ms
    nextNodeId: string
  }
  onEnter?: (speaker: DialogueParticipant, listener: DialogueParticipant) => void
  onExit?: (speaker: DialogueParticipant, listener: DialogueParticipant) => void
  metadata?: Record<string, any>
}

/**
 * Dialogue tree
 */
export interface DialogueTree {
  id: string
  name: string
  description?: string
  nodes: Map<string, DialogueNode>
  startNodeId: string
  metadata?: Record<string, any>
}

/**
 * Dialogue state (per entity conversation)
 */
export interface DialogueState {
  treeId: string
  currentNodeId: string
  speaker: DialogueParticipant
  listener: DialogueParticipant
  history: string[]           // Node IDs visited
  variables: Map<string, any> // Dialogue-scoped variables
  startTime: number
  lastUpdateTime: number
}

/**
 * Dialogue manager
 */
export class DialogueManager {
  private trees: Map<string, DialogueTree> = new Map()
  private activeDialogues: Map<string, DialogueState> = new Map()

  /**
   * Register dialogue tree
   */
  registerTree(tree: DialogueTree): void {
    this.trees.set(tree.id, tree)
  }

  /**
   * Start dialogue between two entities
   */
  startDialogue(treeId: string, speaker: DialogueParticipant, listener: DialogueParticipant): DialogueState | null {
    const tree = this.trees.get(treeId)
    if (!tree) {
      console.warn(`Dialogue tree "${treeId}" not found`)
      return null
    }

    const startNode = tree.nodes.get(tree.startNodeId)
    if (!startNode) {
      console.warn(`Start node "${tree.startNodeId}" not found in tree "${treeId}"`)
      return null
    }

    // Create dialogue state
    const dialogueKey = `${speaker.id}:${listener.id}:${treeId}`
    const state: DialogueState = {
      treeId,
      currentNodeId: tree.startNodeId,
      speaker,
      listener,
      history: [tree.startNodeId],
      variables: new Map(),
      startTime: Date.now(),
      lastUpdateTime: Date.now()
    }

    this.activeDialogues.set(dialogueKey, state)

    // Call onEnter hook
    if (startNode.onEnter) {
      startNode.onEnter(speaker, listener)
    }

    return state
  }

  /**
   * Get current dialogue state
   */
  getDialogueState(speaker: DialogueParticipant, listener: DialogueParticipant, treeId: string): DialogueState | null {
    const dialogueKey = `${speaker.id}:${listener.id}:${treeId}`
    return this.activeDialogues.get(dialogueKey) || null
  }

  /**
   * Advance dialogue with choice
   */
  choose(state: DialogueState, choiceId: string): boolean {
    const tree = this.trees.get(state.treeId)
    if (!tree) return false

    const currentNode = tree.nodes.get(state.currentNodeId)
    if (!currentNode || !currentNode.choices) return false

    const choice = currentNode.choices.find(c => c.id === choiceId)
    if (!choice) return false

    // Check condition
    if (choice.condition && !choice.condition(state.speaker, state.listener)) {
      return false
    }

    // Call onExit hook
    if (currentNode.onExit) {
      currentNode.onExit(state.speaker, state.listener)
    }

    // Advance to next node
    const nextNode = tree.nodes.get(choice.nextNodeId)
    if (!nextNode) return false

    state.currentNodeId = choice.nextNodeId
    state.history.push(choice.nextNodeId)
    state.lastUpdateTime = Date.now()

    // Apply emotion change from choice
    if (choice.emotion && state.speaker.emotion) {
      if (choice.emotion.valence !== undefined) {
        state.speaker.emotion.valence = choice.emotion.valence
      }
      if (choice.emotion.arousal !== undefined) {
        state.speaker.emotion.arousal = choice.emotion.arousal
      }
      if (choice.emotion.dominance !== undefined) {
        state.speaker.emotion.dominance = choice.emotion.dominance
      }
    }

    // Call onEnter hook
    if (nextNode.onEnter) {
      nextNode.onEnter(state.speaker, state.listener)
    }

    return true
  }

  /**
   * Get current node
   */
  getCurrentNode(state: DialogueState): DialogueNode | null {
    const tree = this.trees.get(state.treeId)
    if (!tree) return null

    return tree.nodes.get(state.currentNodeId) || null
  }

  /**
   * Get current text (resolved if function)
   */
  getCurrentText(state: DialogueState): string | null {
    const node = this.getCurrentNode(state)
    if (!node) return null

    if (typeof node.text === 'function') {
      return node.text(state.speaker, state.listener)
    }

    return node.text
  }

  /**
   * Get available choices (filtered by conditions)
   */
  getAvailableChoices(state: DialogueState): DialogueChoice[] {
    const node = this.getCurrentNode(state)
    if (!node || !node.choices) return []

    return node.choices.filter(choice => {
      if (!choice.condition) return true
      return choice.condition(state.speaker, state.listener)
    })
  }

  /**
   * End dialogue
   */
  endDialogue(state: DialogueState): void {
    const dialogueKey = `${state.speaker.id}:${state.listener.id}:${state.treeId}`
    this.activeDialogues.delete(dialogueKey)
  }

  /**
   * Update all active dialogues (check auto-advance)
   */
  update(_dt: number): void {
    const now = Date.now()

    for (const [_key, state] of this.activeDialogues) {
      const node = this.getCurrentNode(state)
      if (!node || !node.autoAdvance) continue

      const timeSinceUpdate = now - state.lastUpdateTime
      if (timeSinceUpdate >= node.autoAdvance.delay) {
        // Auto-advance to next node
        const tree = this.trees.get(state.treeId)
        if (!tree) continue

        const nextNode = tree.nodes.get(node.autoAdvance.nextNodeId)
        if (!nextNode) continue

        // Call onExit hook
        if (node.onExit) {
          node.onExit(state.speaker, state.listener)
        }

        state.currentNodeId = node.autoAdvance.nextNodeId
        state.history.push(node.autoAdvance.nextNodeId)
        state.lastUpdateTime = now

        // Call onEnter hook
        if (nextNode.onEnter) {
          nextNode.onEnter(state.speaker, state.listener)
        }
      }
    }
  }

  /**
   * Get all active dialogues
   */
  getActiveDialogues(): DialogueState[] {
    return Array.from(this.activeDialogues.values())
  }

  /**
   * Get dialogue tree
   */
  getTree(treeId: string): DialogueTree | undefined {
    return this.trees.get(treeId)
  }

  /**
   * Get all registered trees
   */
  getAllTrees(): DialogueTree[] {
    return Array.from(this.trees.values())
  }
}

/**
 * Dialogue builder for fluent API
 */
export class DialogueBuilder {
  private tree: Partial<DialogueTree>
  private nodes: Map<string, DialogueNode> = new Map()

  constructor(id: string, name: string) {
    this.tree = {
      id,
      name,
      nodes: this.nodes
    }
  }

  description(desc: string): this {
    this.tree.description = desc
    return this
  }

  start(nodeId: string): this {
    this.tree.startNodeId = nodeId
    return this
  }

  node(node: DialogueNode): this {
    this.nodes.set(node.id, node)
    return this
  }

  metadata(metadata: Record<string, any>): this {
    this.tree.metadata = metadata
    return this
  }

  build(): DialogueTree {
    if (!this.tree.startNodeId) {
      throw new Error('Dialogue tree must have a start node')
    }

    if (!this.nodes.has(this.tree.startNodeId)) {
      throw new Error(`Start node "${this.tree.startNodeId}" not found`)
    }

    return this.tree as DialogueTree
  }
}

/**
 * Helper: Create simple dialogue node
 */
export function createNode(
  id: string,
  text: string | ((speaker: DialogueParticipant, listener: DialogueParticipant) => string),
  choices?: DialogueChoice[]
): DialogueNode {
  return {
    id,
    text,
    choices
  }
}

/**
 * Helper: Create choice
 */
export function createChoice(
  id: string,
  text: string,
  nextNodeId: string,
  condition?: (speaker: DialogueParticipant, listener: DialogueParticipant) => boolean
): DialogueChoice {
  return {
    id,
    text,
    nextNodeId,
    condition
  }
}
