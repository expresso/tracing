import { IExpressoTracerConfig } from './types'
import { NodeTracer } from '@opentelemetry/node'
import { initGlobalTracer } from '@opentelemetry/core'
import { SimpleSpanProcessor } from '@opentelemetry/tracing'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'

export function init (config: IExpressoTracerConfig) {
  const tracer = new NodeTracer({
    plugins: {
      http: {
        enabled: true,
        path: '@opentelemetry/plugin-http'
      }
    },
    ...(config.tracer ?? {})
  })

  const exporter = new JaegerExporter(config.jaeger)
  tracer.addSpanProcessor(new SimpleSpanProcessor(exporter))

  return initGlobalTracer(tracer)
}

export default { init }
