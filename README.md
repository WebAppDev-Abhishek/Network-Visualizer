# Network Topology Visualizer

A modern, interactive web application built with Next.js and TypeScript that allows users to create and visualize network topologies in real-time. This tool provides an intuitive drag-and-drop interface for designing network architectures with various node types including Internet, Server, Router, Satellite, Linux, and Windows nodes.

## Key Features

- **Interactive Node Creation**: Create different types of network nodes with distinct visual representations and connection rules
- **Smart Connection Logic**: Enforces hierarchical network rules (Internet → Server → Router → Client)
- **Real-time Visualization**: Dynamic connection lines with animated paths and distance labels
- **Theme Support**: Seamless light/dark mode switching with consistent visual styling
- **Customizable Display**: Adjustable grid styles, node appearances, and connection visualizations
- **Undo/Redo Support**: Track and reverse network modifications
- **Responsive Design**: Works across different screen sizes and devices

## Technical Details

- **Frontend Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks and custom state management
- **Animation**: CSS animations for connection paths and node interactions
- **Type Safety**: Strict TypeScript implementation
- **Performance**: Optimized rendering with React's virtual DOM
- **Accessibility**: Keyboard navigation and screen reader support
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/network-topology-visualizer.git
cd network-topology-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Examples

### Basic Network Creation
1. Start by creating an Internet node (required as first node)
2. Add Server nodes connected to the Internet
3. Create Router nodes connected to Servers
4. Add Linux/Windows nodes connected to Routers
5. Optionally add Satellite nodes connected to Internet

### Keyboard Shortcuts
- `Ctrl + D`: Toggle dark/light mode
- `Ctrl + Z`: Undo last operation
- `Arrow Keys`: Navigate grid
- `Enter`: Select node type
- `Escape`: Close menus

### Node Types and Connections
- **Internet Node (🌍)**: Central node, connects to Servers and Satellites
- **Server Node (🖥)**: Connects to Internet and Routers
- **Router Node (🔄)**: Connects to Servers and Client nodes
- **Satellite Node (🛰️)**: Connects directly to Internet
- **Linux Node (🐧)**: Connects to Routers
- **Windows Node (🪟)**: Connects to Routers
- **Blank Node (⬜)**: Placeholder node with no connections

### Customization Options
- Adjust grid style (default, minimal, dots)
- Change node appearance (default, rounded, circle)
- Toggle node and path labels
- Select from predefined color schemes
- Modify connection animations and styles

## Use Cases

- **Network Architecture Planning**: Design and document network topologies
- **Educational Tool**: Teach network concepts and hierarchy
- **System Design**: Prototype and visualize network infrastructure
- **Documentation**: Create visual network documentation
- **Troubleshooting**: Visualize network issues and solutions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- React team for the powerful UI library 

## 🚀 Call to Action for Web Developers

Hey fellow developers! 👋 Looking for an exciting project to contribute to? This Network Topology Visualizer is the perfect playground for your creativity and skills! Here's why you should join:

### Current Challenges 🎯
- Implement real-time collaboration features
- Add support for custom node types and icons
- Create a node grouping system
- Develop an export/import feature for network configurations
- Build a connection strength visualization system
- Add network traffic simulation
- Implement a node search and filter system
- Create a connection validation system with error highlighting

### Why Contribute? 💡
- Work with modern tech stack (Next.js 14, TypeScript, Tailwind CSS)
- Learn about network visualization and state management
- Build your portfolio with a practical, real-world application
- Get experience with complex UI interactions and animations
- Join a growing community of network visualization enthusiasts

### How to Get Started 🛠️
1. Fork the repository
2. Pick a challenge from the list above or propose your own feature
3. Create a new branch for your feature
4. Submit a pull request with your implementation
5. Get feedback and improve your code

### Need Help? 🤝
- Open an issue to discuss your ideas
- Join our community discussions
- Check out the existing codebase for inspiration
- Review our contribution guidelines

Let's make this tool even more powerful together! Your contributions can help shape the future of network visualization. 🌟

*"The best way to predict the future is to implement it." - Alan Kay* 