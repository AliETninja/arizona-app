export type Environment = "development" | "production";

type Host = { apiUrl: string; webUrl: string };

export const hosts: Record<Environment, Host> = {
  development: {
    apiUrl: "https://ms-arizona-dev-c6hgw5heia-rj.a.run.app",
    webUrl: "https://ms-arizona-web-dev-c6hgw5heia-rj.a.run.app",
  },
  production: {
    apiUrl: "",
    webUrl: "https://arizonalog.com.br",
  },
};

export const defaultEnvironment: Environment = "development";

let current: Environment = defaultEnvironment;

export const activeEnvironment = {
  get: () => current,
  set(next: Environment) {
    current = next;
  },
};

export const apiBaseUrl = () => hosts[current].apiUrl;
export const webBaseUrl = () => hosts[current].webUrl;
