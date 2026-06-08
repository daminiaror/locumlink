import type { Test } from 'supertest';
import type TestAgent from 'supertest/lib/agent';

type SuperTestAgent = TestAgent<Test>;

export function authedAgent(agent: SuperTestAgent, token: string) {
  const auth = (req: Test) => req.set('Authorization', `Bearer ${token}`);

  return {
    get: (url: string) => auth(agent.get(url)),
    post: (url: string, body?: object) => {
      const req = auth(agent.post(url));
      return body !== undefined ? req.send(body) : req;
    },
    patch: (url: string, body?: object) => {
      const req = auth(agent.patch(url));
      return body !== undefined ? req.send(body) : req;
    },
    delete: (url: string) => auth(agent.delete(url)),
  };
}
