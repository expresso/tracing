import { ExporterConfig } from '@opentelemetry/exporter-jaeger/build/src/types'
import { NodeTracerConfig } from '@opentelemetry/node/build/src/config'

export type IExpressoTracerConfig = {
  jaeger: ExporterConfig
  tracer?: NodeTracerConfig
}
