export const initialNodes = [
  {
    id: '1',
    position: { x: 80, y: -411 },
    type: 'value',
    data: { value: 10 }
  },
  {
    id: '2',
    position: { x: 446, y: -411 },
    type: 'value',
    data: { value: 30 }
  },
  {
    id: '3',
    position: { x: 809, y: -411 },
    type: 'value',
    data: { value: 10 }
  },
  {
    id: '4',
    position: { x: 251, y: -411 },
    type: 'value',
    data: { value: 10 }
  },
  {
    id: '4',
    position: { x: 287, y: -154 },
    type: 'operator',
    data: { operator: '+' }
  },
/*   {
    id: '5',
    position: { x: 555, y: 28 },
    type: 'operator',
    data: { operator: '+' }
  }, */
  {
    id: '6',
    position: { x: 460, y: 308 },
    type: 'result'
  }
];

export const initialEdges = [
  { id: 'e1-4', source: '1', target: '4', animated: true, targetHandle: 'target-a' },
  { id: 'e2-4', source: '2', target: '4', animated: true, targetHandle: 'target-b' },

/*   { id: 'e4-5', source: '4', target: '5', animated: true, targetHandle: 'target-a' },
  { id: 'e3-5', source: '3', target: '5', animated: true, targetHandle: 'target-b' }, */

  { id: 'e5-6', source: '5', target: '6', animated: true }

];
