export interface OktaPolicy {
  type: string;
  id: string;
  status: string;
  name: string;
  description: string;
  priority: number;
  system: boolean;
  conditions: {
    clients: {
      include: string[];
    };
  };
}
export interface OktaPolicyCollection {
  each: (cb: (policy: OktaPolicy) => void | Promise<void> | boolean) => Promise<void>;
}
