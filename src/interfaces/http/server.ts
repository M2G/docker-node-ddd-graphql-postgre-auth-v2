import { ApolloServer } from '@apollo/server';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyApollo, {
  ApolloFastifyContextFunction,
  fastifyApolloDrainPlugin,
} from '@as-integrations/fastify';
// import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl';
import { ApolloServerPluginLandingPageGraphQLPlayground } from '@apollo/server-plugin-landing-page-graphql-playground';
import { startStandaloneServer } from '@apollo/server/standalone';
// import express from 'express';
// import cors from 'cors';
// import http from 'http';
// import { json } from 'body-parser';

interface MyContext {}

export default ({ config, logger, auth, schema, verify }: any) => {
  const fastify = Fastify();
  // const app = express();

  // const httpServer = http.createServer(app);
  const apolloServer = new ApolloServer({
    cache: 'bounded',
    csrfPrevention: true,
    introspection: true,
    plugins: [
      fastifyApolloDrainPlugin(fastify),
      ApolloServerPluginCacheControl({ defaultMaxAge: 5 }),
      // ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageGraphQLPlayground({}),
    ],
    resolvers: schema.resolvers,
    typeDefs: schema.typeDefs,
  });

  /*
  app.use(
    cors({
      credentials: true,
      origin: true,
    }),
  );
  app.disable('x-powered-by');
  app.use(auth.initialize());
  app.use(auth.authenticate);
*/

  return {
    server: apolloServer,
    serverStandalone:
      process.env.NODE_ENV === 'test' &&
      startStandaloneServer(apolloServer, { listen: config.port }),
    fastify,
    start: async (): Promise<unknown> =>
      new Promise(async () => {
        try {
          await apolloServer.start();

          await fastify.register(rateLimit);

          void fastify.register(auth.initialize());

          fastify.route({
            url: '/graphql',
            method: ['POST', 'OPTIONS'],
            handler: fastifyApollo(apolloServer),
            preHandler: auth.authenticate,
            preValidation: verify.authorization,
          });


          await fastify.listen({ host: '0.0.0.0', port: config.port });

          const address: any = fastify.server.address();

          logger.info(`API - Port ${address?.port}`);
          logger.info(`🚀 Server ready at http://localhost:8181/graphql`);
        } catch (err) {
          fastify.log.error(err);
          process.exit(1);
        }

        /*
        if (process.env.NODE_ENV === 'development') {
          return app.listen(config.port, async () => {
            console.log('config.port config.port', config.port);
            await apolloServer.start();
            app.use(
              '/graphql',
              cors(),
              json(),
              expressMiddleware(apolloServer, {
                context: verify.authorization,
              }),
            );
            logger.info(`🚀 Server ready at http://localhost:8181/graphql`);
          });
        }
        */
      }),
  };
};
