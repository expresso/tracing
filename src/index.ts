import mung from 'express-mung'
import { Request, Response } from 'express'
import { Span, Tracer } from '@opentelemetry/types'
import * as opentelemetry from '@opentelemetry/core'

export type TracingHookFunction = (responseBody: any, req: Request, res: Response, span: Span, tracer: Tracer) => void

export type HooksObject = {
  before: TracingHookFunction
  after: TracingHookFunction
}

export function factory ({ before, after }: Partial<HooksObject>) {
  return mung.json((body: any, req: Request, res: Response) => {
    const tracer = opentelemetry.getTracer()
    const span = tracer.getCurrentSpan()

    if (!span) return

    if (before) before(body, req, res, span, tracer)

    const { traceId } = span.context()
    res.append('Jaeger-Trace-Id', traceId)

    span.addEvent('', {
      request: JSON.stringify({
        body: req.body || {},
        headers: req.headers,
        query: req.query
      }, null, 4)
    })

    span.addEvent('', {
      response: JSON.stringify({
        body,
        headers: res.getHeaders()
      }, null, 4)
    })

    if (after) after(body, req, res, span, tracer)
  })
}

export default { factory }
