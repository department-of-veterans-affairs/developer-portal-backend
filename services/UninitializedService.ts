import { MonitoredService, ServiceHealthCheckResponse, EnvironmentVariablePair } from "../types";


export default class UninitializedService implements MonitoredService {
    
    private serviceName: string;
    private errorMessage?: string;

    constructor(serviceName: string, errorMessage?: string) {
        this.serviceName = serviceName;
        this.errorMessage = errorMessage;
    }

    public async healthCheck(): Promise<ServiceHealthCheckResponse> {
        let response: ServiceHealthCheckResponse = {
            serviceName: this.serviceName,
            healthy: false
        }
        if(!!this.errorMessage){
            response.err = {
                message: this.errorMessage
            }
        }
        return response;
    }

    public static generateMissingEnvVarMessage(...missingEnvironmentVariablePairs: EnvironmentVariablePair[]): string {
        const missingEnvironmentVariables: string = missingEnvironmentVariablePairs.filter(arg => !arg.value).map(arg => arg.name).join(', ');
        return `The following environment variables are uninitialized: ${missingEnvironmentVariables}`;
    }

    public static isServiceInitializable(...environmentVariablePairs: EnvironmentVariablePair[]): boolean {
        return environmentVariablePairs.filter(arg => !arg.value).length <= 0;
    }
}