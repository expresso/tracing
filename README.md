# Tracing

Distributed tracing toolset for expresso. Traces requests using Jaeger.

## Summary
- [Tracing](#tracing)
  - [Summary](#summary)
  - [How this works](#how-this-works)
  - [Basic Usage](#basic-usage)
    - [Tracer](#tracer)
      - [Initialization](#initialization)
    - [Middleware](#middleware)
      - [Usage:](#usage)
      - [Hooks](#hooks)
  - [Configuration Object](#configuration-object)
  - [Adding additional data to spans](#adding-additional-data-to-spans)

## How this works

The tracer file will hook in `require('http')` to auto-instrument
every request that's either coming in or out of the service. This is done by [@opentelemetry/node](https://www.npmjs.com/package/@opentelemetry/node) and [@opentelemetry/plugin-http](https://www.npmjs.com/package/@opentelemetry/plugin-http).

Meanwhile, the middleware will add some extra info to the traced
requests (request/response body, headers and query). This is done using [express-mung](https://www.npmjs.com/package/express-mung)

## Basic Usage

Installing:

`$ npm install @expresso/tracing`

### Tracer

The tracer module is responsible for adding the required headers to all outgoing requests, plus reading headers from and logging incoming requests.

To know more about the config object, see [Configuration Object](#configuration-object)

> **IMPORTANT:** This should be intialized on the entrypoint of your application,
> before you require `@expresso/app` or any other module that `require`s node's native `http` module.
>
> **Modules required before the tracer is initialized will *not* be instrumented**


#### Initialization

```typescript
import tracer, { IExpressoTracerConfig } from '@expresso/tracer'

const tracerConfig: IExpressoTracerConfig = {
  jaeger: {
    serviceName: process.env.JAEGER_SERVICE_NAME,
    host: process.env.JAEGER.HOST
  }
}

tracer.init(config)
```

### Middleware

The middleware is used to gather some more information from the request and response objects (body, headers and query)
and add it to the jaeger span. This will also add a `Jaeger-Trace-Id` header to all of your responses.

#### Usage:

```typescript
import expresso from '@expresso/app'
import tracing from '@expresso/tracing'

export const app = expresso((app, config) => {
  app.use(tracing.factory({
    before: (body, req, res, span, tracer) => { /* do something with the parameters here */ },
    after: (body, req, res, span, tracer) => { /* do something with the parameters here */ }
  }))

  /**
   * All of your enpoints must come after the middleware
   * Endpoints registered before the middleware will not have
   * info about their request and response bodies, headers and queries
  */

  app.get('/endpoint', routes.endpoint.factory(config))
})
```

#### Hooks

The middleware factory receives an object with two properties.
Both properties are functions that receive the response body,current request, response, span an tracer.

- `before`: Will be ran before the middleware does anything to the span. Usefor for removing fields you don't want to be logged to jaeger.

- `after`: Will be ran after the span is processed by the middleware, but before it is sent to Jeager.

## Configuration Object

The configuration object has the following type:

```typescript
export type IExpressoTracerConfig = {
  jaeger: {
    // Functions to use for logging
    logger?: types.Logger;
    // Name of the service (this appears on jaeger)
    serviceName: string;
    // Tags to refer to when searching
    tags?: Tag[];
    // Jaeeger host
    host?: string;
    // Jaeger port
    port?: number;
    maxPacketSize?: number;
    /** Force a flush on shutdown */
    forceFlush?: boolean;
    /** Time to wait for an onShutdown flush to finish before closing the sender */
    flushTimeout?: number;
  },
  tracer?: {
    /**
     * Binary formatter which can serialize/deserialize Spans.
     */
    binaryFormat?: BinaryFormat;
    /**
     * Attributed that will be applied on every span created by Tracer.
     * Useful to add infrastructure and environment information to your spans.
     */
    defaultAttributes?: Attributes;
    /**
     * HTTP text formatter which can inject/extract Spans.
     */
    httpTextFormat?: HttpTextFormat;
    /**
     * User provided logger.
     */
    logger?: Logger;
    /** level of logger.  */
    logLevel?: LogLevel;
    /**
     * Sampler determines if a span should be recorded or should be a NoopSpan.
     */
    sampler?: Sampler;
    /**
     * Scope manager keeps context across in-process operations.
     */
    scopeManager?: ScopeManager;
    /** Trace Parameters */
    traceParams?: TraceParams;
  }
}
```

## Adding additional data to spans

Because this uses opentracing's module, you are able to get the tracer and, consequently, the curren span:

```typescript
import * as opentracing

() => { // suppose this is yout route
  const tracer = opentracing.getTracer() // returns the global tracer
  const span = tracer.getCurrentSpan() // This might return undefined. Be careful!

  span?.addEvent('findUser', { userId: 'some-user-id' })
}
```

More than that, you can create child spans:

```typescript
import * as opentracing
import database from './database' // supose this is your db layer

() => { // suppose this is yout route
  const tracer = opentracing.getTracer() // returns the global tracer
  const parent = tracer.getCurrentSpan() // This might return undefined. Be careful!

  const span = tracer.startSpan('find user', { parent })
  span.setAttribute('userId', 'some-user-id')

  await database.findUser('some-user-id')

  span.end()
}
```

Easy, right? That way you can track any sort of event or operation you want.
