
import ConsumerService from '../services/ConsumerService'

// Query all consumers by default
console.log('Querying all consumers');

let consumers: User[] = ConsumerService.getConsumers()