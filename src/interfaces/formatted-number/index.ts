import InterfaceComponent from './interface.vue';

export default {
  id: 'formatted-number',
  name: 'Formatted Number',
  icon: 'pin',
  description: 'Number with thousand separator',
  component: InterfaceComponent,
  types: ['integer', 'bigInteger', 'float', 'decimal'],
};
