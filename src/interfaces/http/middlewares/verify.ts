/*eslint-disable*/
import { GraphQLError, parse, OperationDefinitionNode, FieldNode  } from 'graphql';
import Status from 'http-status';
import { Request } from 'express';

const time = process.env.NODE_ENV === 'development' ? process.env.JWT_TOKEN_EXPIRE_TIME : '2s';

const TOKEN_EXPIRED_ERROR = 'TokenExpiredError';
// const FAIL_AUTH = 'Failed to authenticate token is expired.';

const WHITE_LIST = ['resetPassword', 'forgotPassword', 'signin', 'signup', 'IntrospectionQuery'];

export default ({ jwt }: { jwt: any }) => {
  return {
    authorization: (request, reply, done) => {
      const {
        headers: { authorization },
        body: { query },
      } = request;


      // @see https://stackoverflow.com/questions/64168556/apollo-nodejs-server-how-to-get-mutation-query-schema-path-in-the-request-conte
      const obj = parse(query);
      const operationDefinition = obj.definitions[0] as OperationDefinitionNode;
      const selection = operationDefinition.selectionSet.selections[0] as FieldNode;

      console.log('authorization: ', done);

      console.log('operationName: ', selection?.name?.value);

      // console.log('authorization query query query query query', query);

      if (WHITE_LIST.includes(selection?.name?.value)) return done();
    /*  if (
        query?.includes('resetPassword') ||
        query?.includes('forgotPassword') ||
        query?.includes('signin') ||
        query?.includes('signup') ||
        query?.includes('IntrospectionQuery')
      )
        return null;
*/
      const extractToken = authorization?.startsWith('Bearer ');

      console.log('extractToken extractToken', extractToken);

      if (extractToken) {
        const token = authorization?.split(' ')?.[1];
        try {
          jwt.verify({ maxAge: time })(token);
        } catch (e: any) {
          console.log('e.name TOKEN_EXPIRED_ERROR', e);
          if (e.name === TOKEN_EXPIRED_ERROR)
            throw new GraphQLError(<string>Status[Status.UNAUTHORIZED], {
              extensions: {
                code: Status.UNAUTHORIZED,
                http: { status: 401 },
              },
            });

          throw new GraphQLError(<string>Status[Status.BAD_REQUEST], {
            extensions: {
              code: Status.BAD_REQUEST,
              http: { status: 400 },
            },
          });
        }

        return done();
      }

      throw new Error('No token provided.');
    },
  };
};
