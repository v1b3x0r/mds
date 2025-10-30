/**
 * Expression evaluator for declarative formulas.
 * Compiles a limited arithmetic/logical expression into a safe function.
 */

import { getPathValue } from './path'

const ALLOWED_CHARS = /^[0-9a-zA-Z_.$\s+\-*/()%<>=!&|?,]*$/

const DEFAULT_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
  min: Math.min,
  max: Math.max,
  abs: Math.abs,
  floor: Math.floor,
  ceil: Math.ceil,
  round: Math.round,
  sqrt: Math.sqrt,
  exp: Math.exp,
  log: Math.log,
  sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
  mix: (a: number, b: number, t: number) => a + (b - a) * t
}

const DEFAULT_FUNCTION_NAMES = Object.keys(DEFAULT_FUNCTIONS)
const KEYWORDS = new Set(['true', 'false', 'null', 'undefined'])
const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  PI: Math.PI,
  e: Math.E,
  E: Math.E
}

export class ExpressionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExpressionError'
  }
}

export class Expression {
  private readonly source: string
  private readonly evaluator: (value: PathGetter, fn: Record<string, Function>) => any
  private readonly functions: Record<string, Function>
  private readonly functionNames: Set<string>

  constructor(source: string, customFunctions?: Record<string, Function>) {
    this.source = source.trim()
    if (!this.source) {
      throw new ExpressionError('Expression is empty')
    }
    if (!ALLOWED_CHARS.test(this.source)) {
      throw new ExpressionError('Expression contains unsupported characters')
    }

    this.functions = customFunctions ? { ...DEFAULT_FUNCTIONS, ...customFunctions } : { ...DEFAULT_FUNCTIONS }
    this.functionNames = new Set([
      ...DEFAULT_FUNCTION_NAMES,
      ...(customFunctions ? Object.keys(customFunctions) : [])
    ])
    this.evaluator = Expression.compile(this.source, this.functionNames)
  }

  evaluate(context: Record<string, any>): any {
    try {
      return this.evaluator(
        path => getPathValue(context, path),
        this.functions
      )
    } catch (error) {
      throw new ExpressionError(
        `Failed to evaluate "${this.source}": ${(error as Error).message}`
      )
    }
  }

  private static compile(source: string, functionNames: Set<string>) {
    const tokens = Expression.tokenise(source)
    const js = Expression.translate(tokens, functionNames)
    const body = `'use strict'; return (${js});`

    return new Function('value', 'fn', body) as (
      value: PathGetter,
      fn: Record<string, Function>
    ) => any
  }

  private static tokenise(expression: string): string[] {
    const regex = /([a-zA-Z_][\w.]*)|(==|!=|>=|<=|&&|\|\|)|([0-9]*\.?[0-9]+)|[+\-*/%^(),<>!?]/g
    const tokens: string[] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(expression)) !== null) {
      tokens.push(match[0])
    }

    if (tokens.join('') !== expression.replace(/\s+/g, '')) {
      throw new ExpressionError(`Unable to parse expression "${expression}"`)
    }

    return tokens
  }

  private static translate(tokens: string[], functionNames: Set<string>): string {
    const output: string[] = []
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      if (Expression.isIdentifier(token)) {
        const next = tokens[i + 1]
        if (next === '(' && Expression.isFunction(token, functionNames)) {
          output.push(`fn["${token}"]`)
        } else if (KEYWORDS.has(token)) {
          output.push(token)
        } else if (token in CONSTANTS) {
          output.push(String(CONSTANTS[token]))
        } else {
          output.push(`value("${token}")`)
        }
      } else {
        output.push(token)
      }
    }
    return output.join(' ')
  }

  private static isIdentifier(token: string): boolean {
    return /^[a-zA-Z_][\w.]*$/.test(token)
  }

  private static isFunction(token: string, functionNames: Set<string>): boolean {
    return functionNames.has(token)
  }
}

type PathGetter = (path: string) => any
