export type OktaPolicy = {
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
};
export type OktaAuthMocks = {
  oktaPolicyCollection: OktaPolicy[];
  oktaPolicy: OktaPolicy;
};
