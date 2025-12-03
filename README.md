# Data Structure Visualizer - WebAssembly

An interactive web application that visualizes four fundamental data structures using C++ compiled to WebAssembly. This project demonstrates how to implement efficient data structures in C++ and expose them to JavaScript for real-time visualization.

## Live Demo
(https://hanzla-scripts.github.io/Data-Structure-Visualizer/) 

## Features

### Four Data Structures Implemented
1. **Binary Heap** (Min/Max Heap)
   - Insert and extract operations
   - Visual tree representation
   - Dynamic array display
   - Min/Max heap conversion

2. **AVL Tree** (Self-balancing BST)
   - Insert and delete operations
   - Automatic rotations (LL, RR, LR, RL)
   - Balance factor and height visualization

3. **Graph** (Adjacency Matrix)
   - Directed/undirected graphs
   - Edge weight support
   - Vertex addition/removal
   - Graph algorithms:
     - BFS traversal
     - DFS traversal
     - Dijkstra's shortest path
     - Prim's Minimum Spanning Tree

4. **Hash Table** (Chaining with 10 buckets)
   - Insert and search operations
   - Collision handling via chaining
   - Bucket visualization

### Interactive Visualizations
- Real-time canvas-based rendering
- Color-coded nodes and edges
- Algorithm step highlighting
- Responsive design for all screen sizes

### Performance Highlights
- Core algorithms implemented in C++ for optimal performance
- WebAssembly compilation for near-native speed
- Efficient memory management
- Clean JavaScript/C++ interface

## Technology Stack

### Frontend
- **HTML5 Canvas** for visualizations
- **CSS3** with modern flexbox/grid layout
- **Vanilla JavaScript** for UI interactions
- **Emscripten** for C++ to WebAssembly compilation

### Backend/Core
- **C++17** for data structure implementations
- **Emscripten Bindings** for JavaScript interoperability
- **WebAssembly** for compiled code execution

### Data Structures Implemented in C++
- Binary Heap (array-based)
- AVL Tree with rotations
- Graph (adjacency matrix)
- Hash Table with chaining
- Queue & Stack (used in algorithms)
- Priority Queue (for Dijkstra/Prim)

## Project Structure

```
data-structure-visualizer/
│
├── index.html              # Main HTML document
├── style.css               # Styling and responsive design
├── app.js                  # JavaScript application logic
├── data_structures.js      # Emscripten-generated JS glue code
├── data_structures.cpp     # C++ data structure implementations
└── data_structures.wasm    # Compiled WebAssembly binary
```

## Setup and Installation

### Prerequisites
- Modern web browser with WebAssembly support
- Emscripten SDK (for development/compilation)
- Basic C++ development environment

### Local Development
1. **Clone the repository**
   ```bash
   git clone https://github.com/Hanzla-Scripts/Data-Structure-Visualizer.git
   cd data-structure-visualizer
   ```

2. **Set up Emscripten** (if modifying C++ code)
   ```bash
   # Install Emscripten SDK
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

3. **Compile C++ to WebAssembly**
   ```bash
   emcc data_structures.cpp -o data_structures.js -s WASM=1 --bind -O3
   ```

4. **Run the application**
   - Open `index.html` in a web browser
   - Use any local HTTP server (e.g., `python3 -m http.server`)

## Usage Guide

### Binary Heap
1. Select "Binary Heap" from the navigation bar
2. Enter a number and click "Insert" to add to the heap
3. Click "Extract Top" to remove the root element
4. Toggle between Min/Max heap types
5. Watch the tree structure update in real-time

### AVL Tree
1. Select "AVL Tree" from the navigation bar
2. Insert values to see automatic balancing
3. Delete values to observe rotations
4. Note the balance factors and heights displayed on each node
5. Unbalanced nodes are highlighted with warning symbols

### Graph
1. Select "Graph" and initialize with desired node count
2. Choose directed/undirected mode
3. Add edges with optional weights
4. Run algorithms (BFS, DFS, Dijkstra, Prim)
5. Added/removed vertices are handled dynamically
6. Self-loops are supported and visualized

### Hash Table
1. Select "Hash Table" from the navigation bar
2. Insert key-value pairs
3. Search for keys to see collision handling
4. Observe the chaining visualization in buckets

## Architecture Details

### C++ to JavaScript Bridge
- **Emscripten Bindings**: Type-safe interface between C++ classes and JavaScript
- **Memory Management**: Automatic cleanup with smart pointers and destructors
- **Error Handling**: Graceful fallbacks if WebAssembly fails to load

### Performance Optimizations
- **WebAssembly**: Near-native execution speed for algorithms
- **Efficient Data Structures**: Optimized C++ implementations
- **Minimal DOM Manipulation**: Canvas-based rendering for smooth animations
- **Lazy Initialization**: Data structures created only when needed

### Visualization Engine
- **Canvas-based**: No external dependencies
- **Responsive Scaling**: Adapts to different screen sizes
- **Color Coding**: Visual feedback for different states and algorithms
- **Algorithm Highlighting**: Path visualization for graph algorithms

## Learning Objectives

This project demonstrates:
1. **WebAssembly Integration**: How to compile C++ for web execution
2. **Data Structure Implementation**: Efficient algorithms in C++
3. **Visualization Techniques**: Real-time graphical representation
4. **Cross-language Development**: JavaScript/C++ interoperability
5. **Algorithm Animation**: Step-by-step visualization of complex algorithms

## Known Issues & Limitations

- Graph visualization limited to 15 nodes for clarity
- No persistence between page reloads
- Mobile performance may vary with large graphs
- Requires modern browser with WebAssembly support

## Future Enhancements

Planned features:
- [ ] Save/Load graph configurations
- [ ] Step-by-step algorithm execution
- [ ] Additional data structures (Red-Black Tree, Trie)
- [ ] Export visualization as image/PDF
- [ ] Performance metrics display
- [ ] Multi-language support
- [ ] Dark/light theme toggle

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Emscripten](https://emscripten.org/) for the C++ to WebAssembly compiler
- WebAssembly community for excellent documentation
- All contributors and testers

## Support

For questions, issues, or suggestions:
- Open an issue on GitHub
- Check the troubleshooting section in the documentation

---


Made by Hanzla Khurram




