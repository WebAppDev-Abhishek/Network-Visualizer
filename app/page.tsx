'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Node, NodeType } from './types';

// Add new types for settings and theme
interface Settings {
  darkMode: boolean;
  showNodeLabels: boolean;
  showPathLabels: boolean;
  nodeStyle: 'default' | 'rounded' | 'circle';
  gridStyle: 'default' | 'minimal' | 'dots';
  nodeColor: string;
}

// Update theme colors
const theme = {
  light: {
    background: 'from-gray-50 to-gray-100',
    text: 'text-gray-800',
    grid: 'rgba(0, 0, 0, 0.05)',
    node: {
      default: '#3B82F6',
      hover: '#2563EB',
      selected: '#1D4ED8',
      router: '#10B981', // Green for router
      internet: '#8B5CF6', // Purple for internet
      satellite: '#F59E0B', // Orange for satellite
      blank: '#E5E7EB' // Light gray for blank nodes
    },
    path: {
      background: 'bg-blue-100 bg-opacity-30',
      border: 'border-blue-200',
      dot: 'bg-gray-400'
    },
    settings: {
      background: 'bg-white',
      border: 'border-gray-200',
      input: 'bg-white border-gray-300',
      text: 'text-gray-800'
    }
  },
  dark: {
    background: 'from-gray-900 to-gray-800',
    text: 'text-gray-100',
    grid: 'rgba(255, 255, 255, 0.05)',
    node: {
      default: '#60A5FA',
      hover: '#3B82F6',
      selected: '#2563EB',
      router: '#34D399', // Light green for router
      internet: '#A78BFA', // Light purple for internet
      satellite: '#FBBF24', // Light orange for satellite
      blank: '#374151' // Dark gray for blank nodes
    },
    path: {
      background: 'bg-blue-900 bg-opacity-30',
      border: 'border-blue-800',
      dot: 'bg-gray-500'
    },
    settings: {
      background: 'bg-gray-800',
      border: 'border-gray-700',
      input: 'bg-gray-700 border-gray-600',
      text: 'text-gray-100'
    }
  }
};

// Add a function to calculate distance between two points
const calculateDistance = (point1: { x: number, y: number }, point2: { x: number, y: number }) => {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};

// Update the connection logic functions
const canConnectTo = (sourceType: NodeType, targetType: NodeType): boolean => {
  // Prevent blank node connections
  const isBlankNode = (type: NodeType): boolean => type === 'blank';
  if (isBlankNode(sourceType) || isBlankNode(targetType)) {
    return false;
  }

  const isInternetNode = (type: NodeType): boolean => type === 'internet';
  const isServerNode = (type: NodeType): boolean => type === 'server';
  const isRouterNode = (type: NodeType): boolean => type === 'router';
  const isClientNode = (type: NodeType): boolean => type === 'linux' || type === 'windows';
  const isSatelliteNode = (type: NodeType): boolean => type === 'satellite';
  
  // Define connection rules for other nodes
  if (isInternetNode(targetType)) {
    return isServerNode(sourceType) || isSatelliteNode(sourceType);
  }
  if (isInternetNode(sourceType)) {
    return isServerNode(targetType) || isSatelliteNode(targetType);
  }
  if (isServerNode(targetType)) {
    return isRouterNode(sourceType) || isInternetNode(sourceType);
  }
  if (isServerNode(sourceType)) {
    return isRouterNode(targetType) || isInternetNode(targetType);
  }
  if (isRouterNode(targetType)) {
    return isClientNode(sourceType) || isServerNode(sourceType);
  }
  if (isRouterNode(sourceType)) {
    return isClientNode(targetType) || isServerNode(targetType);
  }
  if (isSatelliteNode(sourceType) || isSatelliteNode(targetType)) {
    return isInternetNode(sourceType) || isInternetNode(targetType);
  }
  return false;
};

// Add function to validate connection
const validateConnection = (sourceNode: Node, targetNode: Node): boolean => {
  // Check if connection is allowed
  if (!canConnectTo(sourceNode.type, targetNode.type)) {
    return false;
  }

  // Check for circular connections
  let current = targetNode;
  while (current.next) {
    if (current.next.id === sourceNode.id) {
      return false; // Would create a circular connection
    }
    current = current.next;
  }

  return true;
};

// Update findNearestNode to handle Server-Router connections
const findNearestNode = (position: { x: number, y: number }, nodes: Node[], nodeType?: NodeType): Node | null => {
  if (nodes.length === 0 || !nodeType) return null;
  
  // Special handling for Internet-Server connections
  if (nodeType === 'server') {
    // For server nodes, prioritize finding Internet node
    const internetNode = nodes.find(node => node.type === 'internet');
    if (internetNode) {
      return internetNode;
    }
    // Then look for router nodes
    const routerNodes = nodes.filter(node => node.type === 'router');
    if (routerNodes.length > 0) {
      // Find the nearest router node
      let nearestRouter = routerNodes[0];
      let minDistance = calculateDistance(position, routerNodes[0].position!);
      for (let i = 1; i < routerNodes.length; i++) {
        const distance = calculateDistance(position, routerNodes[i].position!);
        if (distance < minDistance) {
          minDistance = distance;
          nearestRouter = routerNodes[i];
        }
      }
      return nearestRouter;
    }
  }
  if (nodeType === 'router') {
    // For router nodes, first look for server nodes
    const serverNodes = nodes.filter(node => node.type === 'server');
    if (serverNodes.length > 0) {
      // Find the nearest server node
      let nearestServer = serverNodes[0];
      let minDistance = calculateDistance(position, serverNodes[0].position!);
      for (let i = 1; i < serverNodes.length; i++) {
        const distance = calculateDistance(position, serverNodes[i].position!);
        if (distance < minDistance) {
          minDistance = distance;
          nearestServer = serverNodes[i];
        }
      }
      return nearestServer;
    }
    // Then look for Linux/Windows nodes
    const clientNodes = nodes.filter(node => node.type === 'linux' || node.type === 'windows');
    if (clientNodes.length > 0) {
      let nearestClient = clientNodes[0];
      let minDistance = calculateDistance(position, clientNodes[0].position!);
      for (let i = 1; i < clientNodes.length; i++) {
        const distance = calculateDistance(position, clientNodes[i].position!);
        if (distance < minDistance) {
          minDistance = distance;
          nearestClient = clientNodes[i];
        }
      }
      return nearestClient;
    }
  }
  if (nodeType === 'internet') {
    // For Internet node, only look for server nodes
    const serverNodes = nodes.filter(node => node.type === 'server');
    if (serverNodes.length > 0) {
      return serverNodes[0]; // Return the first server node
    }
    return null;
  }
  
  // For other nodes, filter based on connection rules
  const validNodes = nodes.filter(node => canConnectTo(nodeType, node.type));
  
  if (validNodes.length === 0) return null;
  
  let nearestNode = validNodes[0];
  let minDistance = calculateDistance(position, validNodes[0].position!);
  
  for (let i = 1; i < validNodes.length; i++) {
    const distance = calculateDistance(position, validNodes[i].position!);
    if (distance < minDistance) {
      minDistance = distance;
      nearestNode = validNodes[i];
    }
  }
  
  return nearestNode;
};

// Update grid size constant
const GRID_SIZE = 64; // Changed from 96 to 64

// Update function to get grid cells in shortest path
const getGridCellsBetween = (from: { x: number, y: number }, to: { x: number, y: number }, fromType: NodeType, toType: NodeType) => {
  const cells = new Set<string>();
  
  // Calculate the grid coordinates
  const fromCol = Math.floor(from.x / GRID_SIZE);
  const fromRow = Math.floor(from.y / GRID_SIZE);
  const toCol = Math.floor(to.x / GRID_SIZE);
  const toRow = Math.floor(to.y / GRID_SIZE);
  
  // Only highlight if connection is allowed
  if (!canConnectTo(fromType, toType)) {
    return [];
  }

  // Determine if we should go horizontal first or vertical first
  const goHorizontalFirst = Math.abs(toCol - fromCol) > Math.abs(toRow - fromRow);
  
  if (goHorizontalFirst) {
    // Go horizontal first, then vertical
    const step = fromCol < toCol ? 1 : -1;
    for (let col = fromCol; col !== toCol + step; col += step) {
      cells.add(`${col},${fromRow}`);
    }
    const vStep = fromRow < toRow ? 1 : -1;
    for (let row = fromRow; row !== toRow + vStep; row += vStep) {
      cells.add(`${toCol},${row}`);
    }
  } else {
    // Go vertical first, then horizontal
    const step = fromRow < toRow ? 1 : -1;
    for (let row = fromRow; row !== toRow + step; row += step) {
      cells.add(`${fromCol},${row}`);
    }
    const hStep = fromCol < toCol ? 1 : -1;
    for (let col = fromCol; col !== toCol + hStep; col += hStep) {
      cells.add(`${col},${toRow}`);
    }
  }
  
  // Remove the start and end cells
  cells.delete(`${fromCol},${fromRow}`);
  cells.delete(`${toCol},${toRow}`);
  
  return Array.from(cells).map(key => {
    const [col, row] = key.split(',').map(Number);
    return {
      x: col * GRID_SIZE + GRID_SIZE / 2,
      y: row * GRID_SIZE + GRID_SIZE / 2
    };
  });
};

// Add predefined colors
const nodeColors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' }
];

// Add node type options with icons
const nodeTypes = [
  { type: 'linux', icon: '🐧', label: 'Linux' },
  { type: 'windows', icon: '🪟', label: 'Windows' },
  { type: 'server', icon: '🖥', label: 'Server' },
  { type: 'router', icon: '🔄', label: 'Router' },
  { type: 'internet', icon: '🌍', label: 'Internet' },
  { type: 'satellite', icon: '🛰️', label: 'Satellite' },
  { type: 'blank', icon: '⬜', label: 'Blank' }
] as const;

// Update Node interface to support multiple connections
interface Node {
  id: string;
  color: string;
  next: Node | null;
  position?: { x: number, y: number };
  type: NodeType;
  connections?: Node[]; // Add connections array for multiple connections
}

export default function Home() {
  const [head, setHead] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [message, setMessage] = useState('');
  const [hoverBoxPosition, setHoverBoxPosition] = useState({ x: 0, y: 0 });
  const [showHoverBox, setShowHoverBox] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add mouse position tracking
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseOverGrid, setIsMouseOverGrid] = useState(false);

  // Update getGridPositions to use new grid size
  const getGridPositions = useCallback(() => {
    if (!containerRef.current) return [];
    const rect = containerRef.current.getBoundingClientRect();
    const positions = [];
    
    // Calculate number of cells in each direction with new grid size
    const cols = Math.floor(rect.width / GRID_SIZE);
    const rows = Math.floor(rect.height / GRID_SIZE);
    
    // Generate grid positions with exact centering
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        positions.push({
          x: (col * GRID_SIZE) + (GRID_SIZE / 2),
          y: (row * GRID_SIZE) + (GRID_SIZE / 2)
        });
      }
    }
    return positions;
  }, []);

  const [gridPositions, setGridPositions] = useState<Array<{x: number, y: number}>>([]);
  const [currentGridIndex, setCurrentGridIndex] = useState(0);

  // Initialize grid positions
  useEffect(() => {
    const positions = getGridPositions();
    setGridPositions(positions);
    if (positions.length > 0) {
      setHoverBoxPosition(positions[0]);
    }
  }, [getGridPositions]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }, []);

  const updateNodeCount = useCallback((newHead: Node | null) => {
    let count = 0;
    let current = newHead;
    while (current) {
      count++;
      current = current.next;
    }
    setNodeCount(count);
  }, []);

  useEffect(() => {
    updateNodeCount(head);
  }, [head, updateNodeCount]);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (operationInProgress) return;
      
      let newIndex = currentGridIndex;
      const cols = Math.floor((containerRef.current?.offsetWidth || 0) / GRID_SIZE);

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = Math.max(0, currentGridIndex - 1);
          break;
        case 'ArrowRight':
          newIndex = Math.min(gridPositions.length - 1, currentGridIndex + 1);
          break;
        case 'ArrowUp':
          newIndex = Math.max(0, currentGridIndex - cols);
          break;
        case 'ArrowDown':
          newIndex = Math.min(gridPositions.length - 1, currentGridIndex + cols);
          break;
        case 'Enter':
          if (showHoverBox) {
            setHoverBoxPosition(hoverBoxPosition);
            setShowNodeTypeMenu(true);
          }
          return;
        case 'Escape':
          setShowNodeTypeMenu(false);
          setShowHoverBox(false);
          return;
      }

      if (newIndex !== currentGridIndex && newIndex >= 0 && newIndex < gridPositions.length) {
        setCurrentGridIndex(newIndex);
        setHoverBoxPosition(gridPositions[newIndex]);
        setShowHoverBox(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentGridIndex, gridPositions, hoverBoxPosition, operationInProgress, showHoverBox]);

  const performOperation = async (operation: () => void) => {
    setOperationInProgress(true);
    operation();
    await new Promise(resolve => setTimeout(resolve, 300));
    setOperationInProgress(false);
  };

  const [settings, setSettings] = useState<Settings>({
    darkMode: false,
    showNodeLabels: true,
    showPathLabels: true,
    nodeStyle: 'default',
    gridStyle: 'default',
    nodeColor: '#3B82F6' // Default blue color
  });
  const [showSettings, setShowSettings] = useState(false);
  const [operationHistory, setOperationHistory] = useState<Array<{type: string, nodeId: string}>>([]);
  const [canUndo, setCanUndo] = useState(false);

  // Add theme-aware styles
  const currentTheme = settings.darkMode ? theme.dark : theme.light;

  // Add undo functionality
  const undoLastOperation = () => {
    if (operationHistory.length === 0) return;
    
    const lastOperation = operationHistory[operationHistory.length - 1];
    // Implement undo logic based on operation type
    setOperationHistory(prev => prev.slice(0, -1));
    setCanUndo(operationHistory.length > 1);
  };

  // Add a function to check if an Internet node exists
  const hasInternetNode = (nodes: Node[]): boolean => {
    return nodes.some(node => node.type === 'internet');
  };

  // Add function to find Internet node
  const findInternetNode = (nodes: Node[]): Node | null => {
    return nodes.find(node => node.type === 'internet') || null;
  };

  // Add function to check if node should connect to Internet
  const shouldConnectToInternet = (nodeType: NodeType): boolean => {
    return nodeType === 'router' || nodeType === 'server';
  };

  // Update insertNode function to handle satellite nodes without disconnecting existing connections
  const insertNode = (position: { x: number, y: number }, type: NodeType = 'default') => {
    // Find all existing nodes
    const existingNodes: Node[] = [];
    let current = head;
    while (current) {
      existingNodes.push(current);
      current = current.next;
    }

    // Prevent creating multiple Internet nodes
    if (type === 'internet' && hasInternetNode(existingNodes)) {
      showMessage('Only one Internet node is allowed');
      return;
    }

    // Set color based on node type
    let nodeColor = settings.nodeColor;
    if (type === 'router') {
      nodeColor = settings.darkMode ? theme.dark.node.router : theme.light.node.router;
    } else if (type === 'internet') {
      nodeColor = '#FFFFFF'; // Always white for Internet node
    } else if (type === 'satellite') {
      nodeColor = settings.darkMode ? theme.dark.node.satellite : theme.light.node.satellite;
    } else if (type === 'blank') {
      nodeColor = settings.darkMode ? theme.dark.node.blank : theme.light.node.blank;
    }

    // Create the new node
    const newNode: Node = {
      id: generateId(),
      color: nodeColor,
      next: null,
      position: position,
      type: type,
      connections: [] // Initialize connections array
    };

    // Special handling for Satellite-Internet connections
    if (type === 'satellite') {
      const internetNode = existingNodes.find(node => node.type === 'internet');
      if (internetNode) {
        // Add the satellite node to the end of the list
        if (!head) {
          setHead(newNode);
        } else {
          let lastNode = head;
          while (lastNode.next) {
            lastNode = lastNode.next;
          }
          lastNode.next = newNode;
        }
        // Add connection to internet node's connections array
        if (!internetNode.connections) {
          internetNode.connections = [];
        }
        internetNode.connections.push(newNode);
        setHead({ ...head });
        showMessage('Satellite connected to Internet');
        setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
        setCanUndo(true);
        return;
      } else {
        showMessage('Internet node must exist to create a Satellite node');
        return;
      }
    }

    // For blank nodes, insert at the end of the list without disrupting existing connections
    if (type === 'blank') {
      if (!head) {
        setHead(newNode);
      } else {
        let lastNode = head;
        while (lastNode.next) {
          lastNode = lastNode.next;
        }
        lastNode.next = newNode;
        setHead({ ...head });
      }
      showMessage('Blank node added');
      setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
      setCanUndo(true);
      return;
    }

    // Regular node insertion logic for other node types
    if (!head) {
      setHead(newNode);
      showMessage('Node inserted');
      setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
      setCanUndo(true);
      return;
    }

    // Special handling for Internet-Server connections
    if (type === 'server') {
      const internetNode = existingNodes.find(node => node.type === 'internet');
      if (internetNode) {
        newNode.next = internetNode.next;
        internetNode.next = newNode;
        setHead({ ...head });
        showMessage('Server connected to Internet');
        setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
        setCanUndo(true);
        return;
      }
    }

    // Handle client (Windows/Linux) connections to router
    if (type === 'windows' || type === 'linux') {
      const routerNodes = existingNodes.filter(node => node.type === 'router');
      if (routerNodes.length > 0) {
        const targetRouter = findNearestNode(position, routerNodes, type);
        if (targetRouter) {
          // Add connection to router's connections array
          if (!targetRouter.connections) {
            targetRouter.connections = [];
          }
          targetRouter.connections.push(newNode);
          // Add the client node to the end of the list
          let lastNode = head;
          while (lastNode.next) {
            lastNode = lastNode.next;
          }
          lastNode.next = newNode;
          setHead({ ...head });
          showMessage(`${type === 'windows' ? 'Windows' : 'Linux'} node connected to Router`);
          setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
          setCanUndo(true);
          return;
        }
      }
    }

    // Handle router connections to server
    if (type === 'router') {
      const serverNodes = existingNodes.filter(node => node.type === 'server');
      if (serverNodes.length > 0) {
        const targetServer = findNearestNode(position, serverNodes, type);
        if (targetServer) {
          newNode.next = targetServer.next;
          targetServer.next = newNode;
          setHead({ ...head });
          showMessage('Router connected to Server');
          setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
          setCanUndo(true);
          return;
        }
      }
    }

    // For other cases, use the existing connection logic
    const targetNode = findNearestNode(position, existingNodes, type);
    if (targetNode && validateConnection(newNode, targetNode)) {
      if (targetNode === head) {
        newNode.next = head.next;
        setHead({ ...head, next: newNode });
      } else {
        let current = head;
        while (current.next && current.next.id !== targetNode.id) {
          current = current.next;
        }
        newNode.next = current.next?.next || null;
        if (current.next) {
          current.next.next = newNode;
        }
        setHead({ ...head });
      }
      showMessage('Node inserted and connected');
    } else {
      const message = type === 'internet' ? 'Internet node must be created first' :
                     type === 'server' ? 'No Internet or Router node available to connect to' :
                     type === 'router' ? 'No Server node available to connect to' :
                     'No Router node available to connect to';
      showMessage(message);
      return;
    }

    setOperationHistory(prev => [...prev, { type: 'insert', nodeId: newNode.id }]);
    setCanUndo(true);
  };

  // Update deleteNode to include history
  const deleteNode = (nodeToDelete: Node) => {
    if (!head) return;

    if (head.id === nodeToDelete.id) {
      // If deleting the head node
      setHead(head.next);
    } else {
      // Find the node that points to the node we want to delete
      let current = head;
      while (current.next && current.next.id !== nodeToDelete.id) {
        current = current.next;
      }
      if (current.next) {
        // Update the next pointer to skip the deleted node
        current.next = current.next.next;
        // Update the head to trigger re-render
        setHead({ ...head });
      }
    }
    showMessage('Node deleted');
    
    // Add to history
    setOperationHistory(prev => [...prev, { type: 'delete', nodeId: nodeToDelete.id }]);
    setCanUndo(true);
  };

  // Update getGridCellFromMouse to use new grid size
  const getGridCellFromMouse = useCallback((x: number, y: number) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate relative position within container
    const relativeX = x - rect.left;
    const relativeY = y - rect.top;
    
    // Calculate grid cell coordinates with new grid size
    const col = Math.floor(relativeX / GRID_SIZE);
    const row = Math.floor(relativeY / GRID_SIZE);
    
    // Check if within bounds
    const maxCols = Math.floor(rect.width / GRID_SIZE);
    const maxRows = Math.floor(rect.height / GRID_SIZE);
    
    if (col >= 0 && col < maxCols && row >= 0 && row < maxRows) {
      return {
        x: (col * GRID_SIZE) + (GRID_SIZE / 2),
        y: (row * GRID_SIZE) + (GRID_SIZE / 2)
      };
    }
    return null;
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    // Check if mouse is within container
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      setIsMouseOverGrid(true);
      const gridCell = getGridCellFromMouse(x, y);
      if (gridCell) {
        // Check if there's already a node at this position
        let isOccupied = false;
        let current = head;
        while (current) {
          if (current.position?.x === gridCell.x && current.position?.y === gridCell.y) {
            isOccupied = true;
            break;
          }
          current = current.next;
        }
        
        if (!isOccupied) {
          setHoverBoxPosition(gridCell);
          setShowHoverBox(true);
        } else {
          setShowHoverBox(false);
        }
      }
    } else {
      setIsMouseOverGrid(false);
      setShowHoverBox(false);
    }
  }, [getGridCellFromMouse, head]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsMouseOverGrid(false);
    setShowHoverBox(false);
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            if (canUndo) undoLastOperation();
            break;
          case 's':
            e.preventDefault();
            setShowSettings(prev => !prev);
            break;
          case 'd':
            e.preventDefault();
            setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canUndo]);

  // Update renderConnection to handle blank node connections
  const renderConnection = (from: { x: number, y: number }, to: { x: number, y: number }, fromType: NodeType, toType: NodeType, distance: number) => {
    const gridCells = getGridCellsBetween(from, to, fromType, toType);
    
    // Only render if connection is allowed
    if (gridCells.length === 0) return null;
    
    // Check connection types
    const isInternetServerConnection = 
      (fromType === 'internet' && toType === 'server') || 
      (fromType === 'server' && toType === 'internet');
    
    const isServerRouterConnection = 
      (fromType === 'server' && toType === 'router') || 
      (fromType === 'router' && toType === 'server');

    const isRouterClientConnection = 
      (fromType === 'router' && (toType === 'windows' || toType === 'linux')) || 
      ((fromType === 'windows' || fromType === 'linux') && toType === 'router');

    const isInternetSatelliteConnection = 
      (fromType === 'internet' && toType === 'satellite') || 
      (fromType === 'satellite' && toType === 'internet');

    const isBlankNodeConnection = 
      fromType === 'blank' || toType === 'blank';

    // Special styling for different connection types
    const connectionStyle = isInternetServerConnection ? {
      background: settings.darkMode ? 'bg-purple-900 bg-opacity-40' : 'bg-purple-100 bg-opacity-40',
      border: settings.darkMode ? 'border-purple-800' : 'border-purple-200',
      dot: settings.darkMode ? 'bg-purple-400' : 'bg-purple-500',
      dotSize: '8px',
      dotSpacing: '12px',
      animation: 'pulse 2s infinite',
      labelColor: settings.darkMode ? 'text-purple-300' : 'text-purple-700',
      labelBorder: settings.darkMode ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.3)',
      labelText: ' (Internet-Server)'
    } : isServerRouterConnection ? {
      background: settings.darkMode ? 'bg-green-900 bg-opacity-40' : 'bg-green-100 bg-opacity-40',
      border: settings.darkMode ? 'border-green-800' : 'border-green-200',
      dot: settings.darkMode ? 'bg-green-400' : 'bg-green-500',
      dotSize: '8px',
      dotSpacing: '12px',
      animation: 'pulse 2s infinite',
      labelColor: settings.darkMode ? 'text-green-300' : 'text-green-700',
      labelBorder: settings.darkMode ? 'rgba(52, 211, 153, 0.3)' : 'rgba(16, 185, 129, 0.3)',
      labelText: ' (Server-Router)'
    } : isRouterClientConnection ? {
      background: settings.darkMode ? 'bg-blue-900 bg-opacity-40' : 'bg-blue-100 bg-opacity-40',
      border: settings.darkMode ? 'border-blue-800' : 'border-blue-200',
      dot: settings.darkMode ? 'bg-blue-400' : 'bg-blue-500',
      dotSize: '8px',
      dotSpacing: '12px',
      animation: 'pulse 2s infinite',
      labelColor: settings.darkMode ? 'text-blue-300' : 'text-blue-700',
      labelBorder: settings.darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.3)',
      labelText: ' (Router-Client)'
    } : isInternetSatelliteConnection ? {
      background: settings.darkMode ? 'bg-orange-900 bg-opacity-40' : 'bg-orange-100 bg-opacity-40',
      border: settings.darkMode ? 'border-orange-800' : 'border-orange-200',
      dot: settings.darkMode ? 'bg-orange-400' : 'bg-orange-500',
      dotSize: '8px',
      dotSpacing: '12px',
      animation: 'pulse 2s infinite',
      labelColor: settings.darkMode ? 'text-orange-300' : 'text-orange-700',
      labelBorder: settings.darkMode ? 'rgba(251, 191, 36, 0.3)' : 'rgba(245, 158, 11, 0.3)',
      labelText: ' (Internet-Satellite)'
    } : isBlankNodeConnection ? {
      background: settings.darkMode ? 'bg-gray-800 bg-opacity-40' : 'bg-gray-100 bg-opacity-40',
      border: settings.darkMode ? 'border-gray-700' : 'border-gray-200',
      dot: settings.darkMode ? 'bg-gray-400' : 'bg-gray-500',
      dotSize: '6px',
      dotSpacing: '16px',
      animation: 'none',
      labelColor: settings.darkMode ? 'text-gray-400' : 'text-gray-600',
      labelBorder: settings.darkMode ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)',
      labelText: ' (Blank)'
    } : {
      background: currentTheme.path.background,
      border: currentTheme.path.border,
      dot: currentTheme.path.dot,
      dotSize: '6px',
      dotSpacing: '16px',
      animation: 'none',
      labelColor: currentTheme.settings.text,
      labelBorder: 'none',
      labelText: ''
    };

    return (
      <>
        {gridCells.map((cell, index) => (
          <div
            key={`grid-${index}`}
            className={`absolute ${connectionStyle.background} ${connectionStyle.border}`}
            style={{
              left: cell.x,
              top: cell.y,
              width: `${GRID_SIZE}px`,
              height: `${GRID_SIZE}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: connectionStyle.animation
            }}
          >
            {/* Only show dots at specific intervals for better visual effect */}
            {index % (isInternetServerConnection || isServerRouterConnection || isRouterClientConnection || isInternetSatelliteConnection ? 2 : 3) === 0 && (
              <div
                className={`absolute ${connectionStyle.dot} rounded-full`}
                style={{
                  width: connectionStyle.dotSize,
                  height: connectionStyle.dotSize,
                  boxShadow: '0 0 3px rgba(0, 0, 0, 0.1)',
                  animation: (isInternetServerConnection || isServerRouterConnection || isRouterClientConnection || isInternetSatelliteConnection) ? 'pulse 2s infinite' : 'none'
                }}
              />
            )}
          </div>
        ))}
        {settings.showPathLabels && (
          <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
              settings.darkMode ? 'bg-gray-800' : 'bg-white'
            } px-2 py-1 rounded text-sm shadow-md ${connectionStyle.labelColor}`}
            style={{
              left: (from.x + to.x) / 2,
              top: (from.y + to.y) / 2,
              zIndex: 2,
              fontSize: '0.75rem',
              border: connectionStyle.labelBorder !== 'none' 
                ? `1px solid ${connectionStyle.labelBorder}`
                : 'none'
            }}
          >
            {Math.round(distance)}px{connectionStyle.labelText}
          </div>
        )}
      </>
    );
  };

  // Add state for delete confirmation
  const [nodeToDelete, setNodeToDelete] = useState<Node | null>(null);

  // Update renderNodes to handle multiple connections
  const renderNodes = () => {
    const nodes = [];
    const connections = [];
    let current = head;
    let index = 0;
    
    // First pass: collect all nodes
    const allNodes: Node[] = [];
    while (current !== null) {
      allNodes.push(current);
      current = current.next;
    }
    
    // Second pass: render connections and nodes
    current = head;
    while (current !== null) {
      const node = current;
      
      // Render main next connection
      if (node.next && node.position && node.next.position) {
        const connection = renderConnection(
          node.position,
          node.next.position,
          node.type,
          node.next.type,
          calculateDistance(node.position, node.next.position)
        );
        if (connection) {
          connections.push(
            <div key={`conn-${node.id}-${node.next.id}`}>
              {connection}
            </div>
          );
        }
      }

      // Render additional connections for both Internet and Router nodes
      if ((node.type === 'internet' || node.type === 'router') && node.connections && node.position) {
        node.connections.forEach((connectedNode, idx) => {
          if (connectedNode.position) {
            const connection = renderConnection(
              node.position,
              connectedNode.position,
              node.type,
              connectedNode.type,
              calculateDistance(node.position, connectedNode.position)
            );
            if (connection) {
              connections.push(
                <div key={`conn-${node.id}-${connectedNode.id}-${idx}`}>
                  {connection}
                </div>
              );
            }
          }
        });
      }

      // Render the node
      nodes.push(
        <div 
          key={node.id} 
          className="absolute flex items-center transition-all duration-300"
          style={{
            left: node.position?.x || 0,
            top: node.position?.y || 0,
            transform: 'translate(-50%, -50%)',
            boxSizing: 'border-box',
            zIndex: index + 1
          }}
        >
          <div
            className="relative group transform transition-all duration-300 hover:scale-110"
            onMouseEnter={() => setSelectedNode(node)}
            onMouseLeave={() => setSelectedNode(null)}
            style={{
              width: `${GRID_SIZE}px`,
              height: `${GRID_SIZE}px`
            }}
          >
            <div
              className={`transition-all duration-300 cursor-pointer shadow-lg
                ${operationInProgress ? 'animate-pulse' : ''}
                ${selectedNode?.id === node.id ? 'ring-4' : ''}
                ${settings.nodeStyle === 'rounded' ? 'rounded-xl' : settings.nodeStyle === 'circle' ? 'rounded-full' : 'rounded-lg'}
                ${node.type === 'router' ? 'border-2 border-green-500' : ''}
                ${node.type === 'internet' ? 'border-2 border-black' : ''}
                ${node.type === 'satellite' ? 'border-2 border-orange-500' : ''}
                ${node.type === 'blank' ? 'border border-dashed border-gray-400' : ''}`}
              style={{ 
                backgroundColor: node.color,
                width: `${GRID_SIZE}px`,
                height: `${GRID_SIZE}px`,
                boxSizing: 'border-box',
                ...(node.type === 'blank' && {
                  opacity: 0.8
                })
              }}
              onClick={() => {
                if (operationInProgress) return;
                setNodeToDelete(node);
              }}
            >
              {/* Node Type Icon */}
              <div className={`absolute inset-0 flex items-center justify-center text-2xl ${
                node.type === 'internet' ? 'text-black' : 
                node.type === 'blank' ? 'text-gray-500' : ''
              }`}>
                {node.type !== 'default' && nodeTypes.find(t => t.type === node.type)?.icon}
              </div>
              {settings.showNodeLabels && (
                <div className={`absolute inset-0 flex items-center justify-center font-bold text-base opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  node.type === 'internet' ? 'text-black' : 
                  node.type === 'blank' ? 'text-gray-500' : 'text-white'
                }`}>
                  {index + 1}
                </div>
              )}
              {/* Additional label for special nodes */}
              {(node.type === 'router' || node.type === 'internet' || node.type === 'satellite' || node.type === 'blank') && (
                <div className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                  node.type === 'internet' ? 'text-black' : 
                  node.type === 'blank' ? 'text-gray-500' : ''
                }`}>
                  {nodeTypes.find(t => t.type === node.type)?.label}
                </div>
              )}
            </div>
          </div>
        </div>
      );
      current = current.next;
      index++;
    }

    // Add delete confirmation popup
    if (nodeToDelete) {
      nodes.push(
        <div
          key="delete-confirmation"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setNodeToDelete(null)}
        >
          <div 
            className={`${settings.darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl p-6 max-w-sm mx-4 transform transition-all`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`text-lg font-medium mb-4 ${settings.darkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete Node
            </h3>
            <p className={`mb-4 ${settings.darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this {nodeToDelete.type} node?
              {nodeToDelete.type === 'internet' && ' This will affect all server connections.'}
              {nodeToDelete.type === 'server' && ' This will affect all router connections.'}
              {nodeToDelete.type === 'router' && ' This will affect all Linux and Windows connections.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                onClick={() => setNodeToDelete(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                onClick={() => {
                  deleteNode(nodeToDelete);
                  setNodeToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      );
    }

    return [...connections, ...nodes];
  };

  // Add clear function
  const clearAllNodes = () => {
    if (head) {
      setHead(null);
      setOperationHistory([]);
      setCanUndo(false);
      showMessage('All nodes cleared');
    }
  };

  const [showNodeTypeMenu, setShowNodeTypeMenu] = useState(false);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType>('default');
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Add node type selection handler
  const handleNodeTypeSelect = (type: NodeType) => {
    // If no nodes exist, only allow Internet node
    if (!head && type !== 'internet') {
      showMessage('First node must be an Internet node');
      return;
    }

    // If Internet node already exists, prevent creating another one
    if (type === 'internet' && hasInternetNode([head].filter(Boolean) as Node[])) {
      showMessage('Only one Internet node is allowed');
      return;
    }

    setSelectedNodeType(type);
    setShowNodeTypeMenu(false);
    insertNode(hoverPosition, type);
  };

  // Update node type menu to show only Internet node if no nodes exist
  const getAvailableNodeTypes = () => {
    if (!head) {
      // Only show Internet node if no nodes exist
      return nodeTypes.filter(type => type.type === 'internet');
    }
    // If Internet node exists, show all node types except Internet
    if (hasInternetNode([head].filter(Boolean) as Node[])) {
      return nodeTypes.filter(type => type.type !== 'internet');
    }
    // If no Internet node exists but there are other nodes, show all types
    return nodeTypes;
  };

  // Add click outside handler for node type menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNodeTypeMenu) {
        const menuElement = document.getElementById('node-type-menu');
        const target = event.target as HTMLElement;
        if (menuElement && !menuElement.contains(target)) {
          setShowNodeTypeMenu(false);
        }
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showNodeTypeMenu]);

  // Move keyframe animation to useEffect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `;
      document.head.appendChild(styleSheet);
      return () => {
        document.head.removeChild(styleSheet);
      };
    }
  }, []);

  return (
    <main className={`h-screen w-screen flex flex-col bg-gradient-to-b ${currentTheme.background}`}>
      <div className="flex-none p-4">
        <div className="flex flex-col gap-4">
          {/* Title and Main Controls */}
          <div className="flex justify-between items-center">
            <h1 className={`text-4xl font-bold ${currentTheme.text}`}>Node Visualizer</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {settings.darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {canUndo && (
                <button
                  onClick={undoLastOperation}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Undo
                </button>
              )}
              {head && (
                <button
                  onClick={clearAllNodes}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Settings Controls */}
          <div className={`grid grid-cols-4 gap-4 p-4 ${currentTheme.settings.background} rounded-lg shadow-md border ${currentTheme.settings.border}`}>
            {/* Grid Style */}
            <div className="flex flex-col gap-2">
              <label className={`font-medium ${currentTheme.settings.text}`}>Grid Style</label>
              <select
                value={settings.gridStyle}
                onChange={(e) => setSettings(prev => ({ ...prev, gridStyle: e.target.value as Settings['gridStyle'] }))}
                className={`p-2 rounded border ${currentTheme.settings.input} ${currentTheme.settings.text}`}
              >
                <option value="default">Default</option>
                <option value="minimal">Minimal</option>
                <option value="dots">Dots</option>
              </select>
            </div>

            {/* Node Style */}
            <div className="flex flex-col gap-2">
              <label className={`font-medium ${currentTheme.settings.text}`}>Node Style</label>
              <select
                value={settings.nodeStyle}
                onChange={(e) => setSettings(prev => ({ ...prev, nodeStyle: e.target.value as Settings['nodeStyle'] }))}
                className={`p-2 rounded border ${currentTheme.settings.input} ${currentTheme.settings.text}`}
              >
                <option value="default">Default</option>
                <option value="rounded">Rounded</option>
                <option value="circle">Circle</option>
              </select>
            </div>

            {/* Node Color */}
            <div className="flex flex-col gap-2">
              <label className={`font-medium ${currentTheme.settings.text}`}>Node Color</label>
              <div className="grid grid-cols-4 gap-2">
                {nodeColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSettings(prev => ({ ...prev, nodeColor: color.value }))}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.nodeColor === color.value ? 'ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2">
              <label className={`font-medium ${currentTheme.settings.text}`}>Display Options</label>
              <div className="flex flex-col gap-2">
                <label className={`flex items-center gap-2 cursor-pointer ${currentTheme.settings.text}`}>
                  <input
                    type="checkbox"
                    checked={settings.showNodeLabels}
                    onChange={(e) => setSettings(prev => ({ ...prev, showNodeLabels: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Node Labels</span>
                </label>
                <label className={`flex items-center gap-2 cursor-pointer ${currentTheme.settings.text}`}>
                  <input
                    type="checkbox"
                    checked={settings.showPathLabels}
                    onChange={(e) => setSettings(prev => ({ ...prev, showPathLabels: e.target.checked }))}
                    className="rounded"
                  />
                  <span>Path Labels</span>
                </label>
              </div>
            </div>
          </div>

          <p className={`text-center ${currentTheme.text}`}>
            Hover over empty grid cells to create nodes. Each new node connects to its nearest neighbor.
            <br />
            <span className="text-sm">Press Ctrl+D for dark mode | Ctrl+Z to undo</span>
          </p>
        </div>
      </div>

      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 animate-fade-in-out z-50">
          {message}
        </div>
      )}

      <div 
        ref={containerRef}
        className={`flex-1 relative ${settings.darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg overflow-hidden`}
        style={{
          backgroundImage: settings.gridStyle === 'default' 
            ? `linear-gradient(to right, ${currentTheme.grid} 1px, transparent 1px),
               linear-gradient(to bottom, ${currentTheme.grid} 1px, transparent 1px)`
            : settings.gridStyle === 'dots'
            ? `radial-gradient(${currentTheme.grid} 1px, transparent 1px)`
            : 'none',
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
          backgroundPosition: '0 0'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Node Type Selection Menu */}
        {showNodeTypeMenu && (
          <div 
            id="node-type-menu"
            className={`absolute z-50 rounded-lg shadow-lg border p-2 ${
              settings.darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
            style={{
              left: hoverPosition.x,
              top: hoverPosition.y,
              transform: 'translate(-50%, -50%)',
              minWidth: '120px'
            }}
            onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up
          >
            <div className="flex flex-col gap-2">
              {getAvailableNodeTypes().map(({ type, icon, label }) => (
                <button
                  key={type}
                  onClick={() => handleNodeTypeSelect(type)}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    settings.darkMode
                      ? 'text-gray-100 hover:bg-gray-700 active:bg-gray-600'
                      : 'text-gray-800 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
            {!head && (
              <div className={`mt-2 px-3 py-2 text-sm ${
                settings.darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                First node must be an Internet node
              </div>
            )}
          </div>
        )}

        {/* Hover Box */}
        {showHoverBox && !showNodeTypeMenu && (
          <div 
            className="absolute border-2 border-dashed border-blue-400 rounded-lg transition-all duration-200 cursor-pointer bg-blue-100 bg-opacity-20 hover:bg-opacity-30 z-50"
            style={{
              left: hoverBoxPosition.x,
              top: hoverBoxPosition.y,
              transform: 'translate(-50%, -50%)',
              width: `${GRID_SIZE}px`,
              height: `${GRID_SIZE}px`,
              boxSizing: 'border-box'
            }}
            onClick={() => {
              setHoverPosition(hoverBoxPosition);
              setShowNodeTypeMenu(true);
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
            </div>
          </div>
        )}

        {/* Linked List Visualization */}
        <div className="absolute inset-0">
          {renderNodes()}
        </div>

        {/* No Nodes Message */}
        {!head && !showHoverBox && (
          <div className="absolute bottom-8 left-0 right-0 text-center text-gray-500 pointer-events-none">
            <p className="text-xl">No nodes in the list</p>
            <p className="text-sm mt-2">Hover over a grid cell to start</p>
          </div>
        )}
      </div>

      <div className={`flex-none p-4 text-center ${currentTheme.text} ${settings.darkMode ? 'bg-gray-800' : 'bg-white'} border-t ${settings.darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        Nodes: {nodeCount} | Press arrow keys to move, Enter to select node type | Ctrl+D for dark mode | Ctrl+Z to undo | {head && 'Click Clear All to remove all nodes'}
      </div>
    </main>
  );
} 