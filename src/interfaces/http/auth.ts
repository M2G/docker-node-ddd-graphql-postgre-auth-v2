import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import BearerStrategy from 'passport-http-bearer';
import Status from 'http-status';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * middleware to check the if auth vaid
 */

export default ({ repository: { usersRepository }, response: { Fail }, jwt }: any) => {
  const bearerStrategy: any = new BearerStrategy(
    'bearer',
    (token: string, done: (arg0: any, arg1: { email: string; password: string } | null) => any) => {
      console.log('------------- BearerStrategy ------------', token);
       const { id }: number = jwt.decode()(token);

      console.log('bearerStrategy', {
        id,
        token,
        usersRepository,
      });

      usersRepository
        .findOne({ id })
        .then((user: { email: any; password: any }) => {
          if (!user) return done(Status[Status.NOT_FOUND], null);
          done(null, { email: user.email, password: user.password });
        })
        .catch((error: null) => done(error, null));
    },
  );

  passport.use(bearerStrategy);
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user as any));

  return {
    authenticate: (request: FastifyRequest, reply: FastifyReply, done) =>
      passport.authenticate('bearer', { session: false }, (err: string, _: any) => {
        console.log('passport.authenticate', err);

        console.log('------------- authenticate ------------');

         /*if (err === Status[Status.NOT_FOUND]) {
          return res.status(Status.NOT_FOUND).json(Fail({ message: Status[Status.NOT_FOUND] }));
        }

        if (err) {
          return res.status(Status.UNAUTHORIZED).json(Fail(Status[Status.UNAUTHORIZED]));
        }

        next();
        */

        console.log('------------- next ------------', done);
        done();
      })(request, reply, done),
    initialize: () => passport.initialize(),
  };
};
