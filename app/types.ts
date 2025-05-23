export type NodeType = 'default' | 'linux' | 'windows' | 'server' | 'router' | 'internet' | 'blank' | 'satellite';

export interface Node {
  id: string;
  color: string;
  next: Node | null;
  position?: { x: number; y: number };
  type: NodeType;
}

export type NodeAction = 'insertFront' | 'insertLast' | 'insertAfter' | 'delete' | 'updateColor'; 