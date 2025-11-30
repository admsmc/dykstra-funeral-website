import Fastify from 'fastify'
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify'
import { appRouter } from './routers/index'
import { createERPClientFromEnv } from './clients/erp-client'
import { createCRMClientFromEnv } from './clients/crm-client'
import type { Context } from './trpc'

/**
 * BFF Server
 * 
 * Backend-for-Frontend layer that orchestrates calls to:
 * - TypeScript CRM backend (tRPC)
 * - Go ERP backend (HTTP/OpenAPI)
 */

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000
const HOST = process.env.HOST || '0.0.0.0'

async function main() {
  const server = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    maxParamLength: 5000,
  })

  // Register tRPC plugin
  await server.register(fastifyTRPCPlugin, {
    prefix: '/trpc',
    trpcOptions: {
      router: appRouter,
      createContext: async ({ req, res }): Promise<Context> => {
        // TODO: Extract user from Clerk JWT in Authorization header
        // For now, return unauthenticated context
        
        const authHeader = req.headers.authorization
        const token = authHeader?.startsWith('Bearer ') 
          ? authHeader.substring(7) 
          : undefined

        return {
          req,
          res,
          user: undefined, // Will be populated after Clerk JWT validation
          erpClient: createERPClientFromEnv(token),
          crmClient: createCRMClientFromEnv(token),
        }
      },
    },
  })

  // Health check endpoint (non-tRPC for load balancers)
  server.get('/health', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' })
  })

  // Start server
  try {
    await server.listen({ port: PORT, host: HOST })
    console.log(`🚀 BFF server listening on http://${HOST}:${PORT}`)
    console.log(`📡 tRPC endpoint: http://${HOST}:${PORT}/trpc`)
    console.log(`🏥 Health check: http://${HOST}:${PORT}/health`)
    console.log(``)
    console.log(`Connected to:`)
    console.log(`  CRM: ${process.env.CRM_BASE_URL || 'http://localhost:3000/api/trpc'}`)
    console.log(`  ERP: ${process.env.ERP_BASE_URL || 'http://localhost:8080'}`)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

main()
