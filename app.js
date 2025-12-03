// Global variables
let currentDS = 'binaryHeap';
let wasmReady = false;
let graphIsDirected = false;
let currentGraphPath = [];
let currentGraphType = '';

// Data structure instances
let binaryHeap = null;
let avlTree = null;
let graph = null;
let hashTable = null;

// Initialize the application
window.onload = function() {
    console.log('Initializing application...');
    
    // Set up data structure selection in navbar
    document.querySelectorAll('.ds-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ds-nav-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            currentDS = this.dataset.ds;
            document.querySelectorAll('.ds-controls').forEach(ctrl => ctrl.classList.remove('active'));
            document.getElementById(`${currentDS}-controls`).classList.add('active');
            
            updateVisualization();
        });
    });

    // Set up event listeners
    setupEventListeners();
    setupHeapTypeToggle();
    
    // The data_structures.js script loads and initializes immediately
    setTimeout(checkWasmExports, 100);
};

// Check if WASM exports are available
function checkWasmExports() {
    console.log('Checking for WebAssembly exports...');
    
    if (typeof Module === 'undefined') {
        console.log('Module not defined yet, waiting...');
        setTimeout(checkWasmExports, 100);
        return;
    }
    
    // Check for our required classes
    const requiredClasses = ['BinaryHeap', 'AVLTree', 'Graph', 'HashTable'];
    const availableClasses = [];
    
    for (const className of requiredClasses) {
        if (typeof Module[className] !== 'undefined' && Module[className] !== null) {
            availableClasses.push(className);
            console.log(`✓ ${className} is available`);
        } else {
            console.log(`✗ ${className} is not available`);
        }
    }
    
    if (availableClasses.length >= 2) {
        console.log('WebAssembly classes are ready!');
        onWasmReady();
    } else {
        console.log('Not enough classes available yet, waiting...');
        if (Module.HEAP8 || Module.HEAP32) {
            console.log('WASM memory detected, proceeding anyway...');
            onWasmReady();
        } else {
            setTimeout(checkWasmExports, 200);
        }
    }
}

// Set up all event listeners
function setupEventListeners() {
    // Binary Heap events
    document.getElementById('insert-heap').addEventListener('click', insertHeap);
    document.getElementById('extract-heap').addEventListener('click', extractHeap);
    document.getElementById('clear-heap').addEventListener('click', clearHeap);
    
    // AVL Tree events
    document.getElementById('insert-avl').addEventListener('click', insertAVL);
    document.getElementById('remove-avl').addEventListener('click', removeAVL);
    document.getElementById('clear-avl').addEventListener('click', clearAVL);
    
    // Graph events
    document.getElementById('init-graph').addEventListener('click', initGraph);
    document.getElementById('add-edge').addEventListener('click', addEdge);
    document.getElementById('remove-edge').addEventListener('click', removeEdge);
    document.getElementById('add-vertex').addEventListener('click', addVertex);
    document.getElementById('remove-vertex').addEventListener('click', removeVertex);
    document.getElementById('clear-graph').addEventListener('click', clearGraph);
    document.getElementById('run-bfs').addEventListener('click', runBFS);
    document.getElementById('run-dfs').addEventListener('click', runDFS);
    document.getElementById('run-dijkstra').addEventListener('click', runDijkstra);
    document.getElementById('run-prim').addEventListener('click', runPrim);
    document.getElementById('graph-directed').addEventListener('change', function() {
        graphIsDirected = this.checked;
        if (graph) {
            try {
                graph.setDirected(graphIsDirected);
                logMessage(`Graph set to ${graphIsDirected ? 'directed' : 'undirected'}`, 'success');
                updateVisualization();
            } catch (error) {
                logMessage(`Error changing graph type: ${error.message}`, 'error');
            }
        }
    });
    
    // Hash Table events
    document.getElementById('insert-hash').addEventListener('click', insertHash);
    document.getElementById('search-hash').addEventListener('click', searchHash);
    document.getElementById('clear-hash').addEventListener('click', clearHash);
}

function onWasmReady() {
    if (wasmReady) return;
    wasmReady = true;
    
    logMessage('Application loaded successfully!', 'success');
    
    console.log('All Module exports:', Object.keys(Module).filter(key => 
        typeof Module[key] === 'function' || 
        (typeof Module[key] === 'object' && Module[key] !== null)
    ));
    
    initializeCppDataStructures();
    updateVisualization();
}

// Initialize C++ data structure instances
function initializeCppDataStructures() {
    try {
        console.log('Initializing C++ data structures...');
        
        if (typeof Module === 'undefined') {
            throw new Error('Emscripten module not found');
        }
        
        let successes = 0;
        
        try {
            binaryHeap = new Module.BinaryHeap(true);
            console.log('✓ BinaryHeap created successfully');
            successes++;
        } catch (e) {
            console.error('✗ Failed to create BinaryHeap:', e);
            binaryHeap = createFallbackObject('BinaryHeap');
        }
        
        try {
            avlTree = new Module.AVLTree();
            console.log('✓ AVLTree created successfully');
            successes++;
        } catch (e) {
            console.error('✗ Failed to create AVLTree:', e);
            avlTree = createFallbackObject('AVLTree');
        }
        
        try {
            // Start with no graph - user must initialize explicitly
            graph = null;
            console.log('✓ Graph will be initialized by user');
            successes++;
        } catch (e) {
            console.error('✗ Failed to handle Graph:', e);
            graph = createFallbackObject('Graph');
        }
        
        try {
            hashTable = new Module.HashTable();
            console.log('✓ HashTable created successfully');
            successes++;
        } catch (e) {
            console.error('✗ Failed to create HashTable:', e);
            hashTable = createFallbackObject('HashTable');
        }
        
        if (successes > 0) {
            logMessage(`C++ data structures initialized (${successes}/4 successful)`, 'success');
        } else {
            logMessage('All C++ data structures failed to initialize, using fallbacks', 'error');
        }
        
        updateStateDisplays();
        
    } catch (error) {
        logMessage(`Error initializing C++ data structures: ${error.message}`, 'error');
        console.error('Initialization error:', error);
        createFallbackObjects();
    }
}

// Create individual fallback object
function createFallbackObject(type) {
    return {
        insert: function(val) { 
            logMessage(`Fallback: Inserted ${val} into ${type}`, 'info');
            return 'Fallback ' + type;
        },
        delete: function() {},
        getArray: function() { return '[]'; },
        getTree: function() { return '[]'; },
        getTable: function() { return '[]'; },
        extractTop: function() { return -1; },
        remove: function(val) { 
            logMessage(`Fallback: Removed ${val} from ${type}`, 'info');
        },
        clear: function() {
            logMessage(`Fallback: Cleared ${type}`, 'info');
        },
        addEdge: function(from, to, weight) {
            logMessage(`Fallback: Added edge ${from}→${to} (weight: ${weight})`, 'info');
        },
        removeEdge: function(from, to) {
            logMessage(`Fallback: Removed edge ${from}→${to}`, 'info');
        },
        removeVertex: function(vertex) {
            logMessage(`Fallback: Removed vertex ${vertex}`, 'info');
            return this;
        },
        setDirected: function(directed) {
            logMessage(`Fallback: Graph set to ${directed ? 'directed' : 'undirected'}`, 'info');
        },
        getIsDirected: function() { return false; },
        getVertexCount: function() { return 6; },
        bfs: function(start) { return '[]'; },
        dfs: function(start) { return '[]'; },
        dijkstra: function(start) { return '[]'; },
        primMST: function() { return '[]'; },
        search: function(key) { return -1; },
        getLastRotation: function() { return "No rotation info available"; }
    };
}

// Create fallback objects if WebAssembly fails
function createFallbackObjects() {
    binaryHeap = createFallbackObject('BinaryHeap');
    avlTree = createFallbackObject('AVLTree');
    graph = createFallbackObject('Graph');
    hashTable = createFallbackObject('HashTable');
}

// Update state displays
function updateStateDisplays() {
    try {
        if (binaryHeap && typeof binaryHeap.getArray === 'function') {
            document.getElementById('heap-array').textContent = binaryHeap.getArray();
        }
        if (avlTree && typeof avlTree.getTree === 'function') {
            document.getElementById('tree-display').textContent = avlTree.getTree();
        }
        if (hashTable && typeof hashTable.getTable === 'function') {
            document.getElementById('hash-table-state').textContent = hashTable.getTable();
        }
    } catch (error) {
        console.error('Error updating state displays:', error);
    }
}

// Logging function
function logMessage(message, type = 'info') {
    const logContent = document.getElementById('log-content');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContent.appendChild(logEntry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Binary Heap Operations
function insertHeap() {
    if (!binaryHeap) {
        logMessage('Binary Heap not initialized', 'error');
        return;
    }
    
    const value = parseInt(document.getElementById('heap-value').value);
    if (isNaN(value)) {
        logMessage('Please enter a valid number', 'error');
        return;
    }
    
    try {
        binaryHeap.insert(value);
        logMessage(`Inserted ${value} into Binary Heap`, 'success');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function extractHeap() {
    if (!binaryHeap) {
        logMessage('Binary Heap not initialized', 'error');
        return;
    }
    
    try {
        const value = binaryHeap.extractTop();
        logMessage(`Extracted value: ${value}`, 'success');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function clearHeap() {
    if (!binaryHeap) {
        logMessage('Binary Heap not initialized', 'error');
        return;
    }
    
    try {
        binaryHeap.clear();
        logMessage('Heap cleared', 'info');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

// Heap type toggle functions
function setupHeapTypeToggle() {
    const heapTypeRadios = document.querySelectorAll('input[name="heap-type"]');
    heapTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked && binaryHeap) {
                convertHeapType(this.value);
            }
        });
    });
}

function convertHeapType(heapType) {
    if (!binaryHeap) {
        logMessage('Binary Heap not initialized', 'error');
        return;
    }
    
    try {
        const currentIsMin = binaryHeap.getIsMinHeap ? binaryHeap.getIsMinHeap() : true;
        
        if (heapType === 'min' && !currentIsMin) {
            binaryHeap.convertToMinHeap();
            logMessage('Converted to Min Heap', 'success');
            document.getElementById('heap-current-type').textContent = 'Min Heap';
        } else if (heapType === 'max' && currentIsMin) {
            binaryHeap.convertToMaxHeap();
            logMessage('Converted to Max Heap', 'success');
            document.getElementById('heap-current-type').textContent = 'Max Heap';
        } else {
            logMessage(`Heap is already ${heapType === 'min' ? 'Min' : 'Max'} Heap`, 'info');
            return;
        }
        
        updateStateDisplays();
        updateVisualization();
        
    } catch (error) {
        logMessage(`Error converting heap: ${error.message}`, 'error');
        console.error('Heap conversion error:', error);
    }
}

// AVL Tree Operations
function insertAVL() {
    if (!avlTree) {
        logMessage('AVL Tree not initialized', 'error');
        return;
    }
    
    const value = parseInt(document.getElementById('avl-value').value);
    if (isNaN(value)) {
        logMessage('Please enter a valid number', 'error');
        return;
    }
    
    try {
        avlTree.insert(value);
        const rotation = avlTree.getLastRotation ? avlTree.getLastRotation() : "Rotation info not available";
        logMessage(`Inserted ${value} into AVL Tree - ${rotation}`, 'success');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function removeAVL() {
    if (!avlTree) {
        logMessage('AVL Tree not initialized', 'error');
        return;
    }
    
    const value = parseInt(document.getElementById('avl-value').value);
    if (isNaN(value)) {
        logMessage('Please enter a valid number', 'error');
        return;
    }
    
    try {
        avlTree.remove(value);
        const rotation = avlTree.getLastRotation ? avlTree.getLastRotation() : "Rotation info not available";
        logMessage(`Removed ${value} from AVL Tree - ${rotation}`, 'success');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function clearAVL() {
    if (!avlTree) {
        logMessage('AVL Tree not initialized', 'error');
        return;
    }
    
    try {
        avlTree.clear();
        logMessage('AVL Tree cleared', 'info');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

// Graph Operations
function initGraph() {
    const nodeCount = parseInt(document.getElementById('graph-nodes').value);
    
    // Allow 1 vertex graph
    if (isNaN(nodeCount) || nodeCount < 1) {
        logMessage('Graph must have at least 1 node', 'error');
        return;
    }
    if (nodeCount > 15) {
        logMessage('Graph is limited to 15 nodes maximum for visualization', 'warning');
    }
    
    try {
        // Clean up existing graph
        if (graph && graph.delete) {
            graph.delete();
        }
        
        // Create new graph with directed flag
        graph = new Module.Graph(nodeCount, graphIsDirected);
        currentGraphPath = [];
        currentGraphType = '';
        logMessage(`Graph initialized with ${nodeCount} nodes (${graphIsDirected ? 'directed' : 'undirected'})`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
        graph = createFallbackObject('Graph');
    }
}

function addEdge() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const from = parseInt(document.getElementById('from-node').value);
    const to = parseInt(document.getElementById('to-node').value);
    const weight = parseInt(document.getElementById('edge-weight').value) || 1;
    
    if (isNaN(from) || isNaN(to)) {
        logMessage('Please enter valid node numbers', 'error');
        return;
    }
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    } else if (graph.getMatrix) {
        const matrixStr = graph.getMatrix();
        const matrix = parseMatrix(matrixStr);
        if (matrix) {
            nodeCount = matrix.length;
        }
    }
    
    if (from < 0 || from >= nodeCount || to < 0 || to >= nodeCount) {
        logMessage(`Node numbers must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    // Self-loops are now allowed
    
    try {
        graph.addEdge(from, to, weight);
        
        // Get graph type for logging
        let isDirected = false;
        if (graph.getIsDirected && graph.getIsDirected()) {
            isDirected = true;
        }
        
        if (from === to) {
            logMessage(`Added self-loop on vertex ${from} (weight: ${weight}) in ${isDirected ? 'directed' : 'undirected'} graph`, 'success');
        } else {
            logMessage(`Added edge ${from} ${isDirected ? '→' : '↔'} ${to} (weight: ${weight}) in ${isDirected ? 'directed' : 'undirected'} graph`, 'success');
        }
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function removeEdge() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const from = parseInt(document.getElementById('from-node').value);
    const to = parseInt(document.getElementById('to-node').value);
    
    if (isNaN(from) || isNaN(to)) {
        logMessage('Please enter valid node numbers', 'error');
        return;
    }
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    } else if (graph.getMatrix) {
        const matrixStr = graph.getMatrix();
        const matrix = parseMatrix(matrixStr);
        if (matrix) {
            nodeCount = matrix.length;
        }
    }
    
    if (from < 0 || from >= nodeCount || to < 0 || to >= nodeCount) {
        logMessage(`Node numbers must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    // Self-loops are now allowed for removal
    
    try {
        graph.removeEdge(from, to);
        
        // Get graph type for logging
        let isDirected = false;
        if (graph.getIsDirected && graph.getIsDirected()) {
            isDirected = true;
        }
        
        if (from === to) {
            logMessage(`Removed self-loop on vertex ${from} from ${isDirected ? 'directed' : 'undirected'} graph`, 'success');
        } else {
            logMessage(`Removed edge ${from} ${isDirected ? '→' : '↔'} ${to} from ${isDirected ? 'directed' : 'undirected'} graph`, 'success');
        }
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function addVertex() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    // Get current node count
    let currentCount = 0;
    if (graph.getVertexCount) {
        currentCount = graph.getVertexCount();
    } else if (graph.getMatrix) {
        const matrixStr = graph.getMatrix();
        const matrix = parseMatrix(matrixStr);
        if (matrix) {
            currentCount = matrix.length;
        }
    }
    
    const newCount = currentCount + 1;
    
    if (newCount > 15) {
        logMessage('Cannot add more than 15 vertices', 'error');
        return;
    }
    
    try {
        // Get current directed state
        let isDirected = false;
        if (graph.getIsDirected && graph.getIsDirected()) {
            isDirected = true;
        }
        
        // Create a new graph with one more vertex
        const oldGraph = graph;
        graph = new Module.Graph(newCount, isDirected);
        
        // Copy existing edges from old graph
        if (oldGraph.getMatrix) {
            const oldMatrixStr = oldGraph.getMatrix();
            const oldMatrix = parseMatrix(oldMatrixStr);
            if (oldMatrix) {
                for (let i = 0; i < currentCount; i++) {
                    for (let j = 0; j < currentCount; j++) {
                        if (oldMatrix[i][j] !== 0) {
                            graph.addEdge(i, j, oldMatrix[i][j]);
                        }
                    }
                }
            }
        }
        
        // Clean up old graph
        if (oldGraph.delete) oldGraph.delete();
        
        logMessage(`Added vertex ${currentCount}. Graph now has ${newCount} vertices.`, 'success');
        document.getElementById('graph-nodes').value = newCount;
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function removeVertex() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const vertexInput = document.getElementById('vertex-to-remove').value;
    const vertex = parseInt(vertexInput);
    
    if (isNaN(vertex)) {
        logMessage('Please enter a valid vertex number to remove', 'error');
        return;
    }
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    } else if (graph.getMatrix) {
        const matrixStr = graph.getMatrix();
        const matrix = parseMatrix(matrixStr);
        if (matrix) {
            nodeCount = matrix.length;
        }
    }
    
    if (vertex < 0 || vertex >= nodeCount) {
        logMessage(`Vertex number must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    if (nodeCount <= 1) {
        logMessage('Cannot remove vertex. Graph must have at least 1 vertex.', 'error');
        return;
    }
    
    try {
        // Use the proper removeVertex method from C++ which returns a new graph
        const newGraph = graph.removeVertex(vertex);
        
        // Clean up the old graph
        if (graph.delete) graph.delete();
        
        // Replace with the new graph
        graph = newGraph;
        
        // Update the node count input
        const newCount = nodeCount - 1;
        document.getElementById('graph-nodes').value = newCount;
        
        // Clear the vertex input
        document.getElementById('vertex-to-remove').value = '';
        
        logMessage(`Removed vertex ${vertex}. Graph now has ${newCount} vertices.`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error removing vertex: ${error.message}`, 'error');
    }
}

function clearGraph() {
    if (!graph) {
        logMessage('Graph not initialized', 'error');
        return;
    }
    
    try {
        // Completely remove the graph
        if (graph.delete) graph.delete();
        graph = null;
        currentGraphPath = [];
        currentGraphType = '';
        document.getElementById('graph-nodes').value = 6; // Reset to default
        document.getElementById('graph-result').textContent = '-';
        logMessage('Graph completely removed from display', 'info');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function runBFS() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const start = parseInt(document.getElementById('start-node').value) || 0;
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    }
    
    if (start < 0 || start >= nodeCount) {
        logMessage(`Start node must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    try {
        const result = graph.bfs(start);
        document.getElementById('graph-result').textContent = result;
        
        // Parse BFS result for path highlighting
        currentGraphPath = result.slice(1, -1).split(',').map(Number).filter(n => !isNaN(n));
        currentGraphType = 'bfs';
        
        logMessage(`BFS traversal: ${result}`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function runDFS() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const start = parseInt(document.getElementById('start-node').value) || 0;
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    }
    
    if (start < 0 || start >= nodeCount) {
        logMessage(`Start node must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    try {
        const result = graph.dfs(start);
        document.getElementById('graph-result').textContent = result;
        
        // Parse DFS result for path highlighting
        currentGraphPath = result.slice(1, -1).split(',').map(Number).filter(n => !isNaN(n));
        currentGraphType = 'dfs';
        
        logMessage(`DFS traversal: ${result}`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function runDijkstra() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    const start = parseInt(document.getElementById('start-node').value) || 0;
    
    // Get current node count
    let nodeCount = 0;
    if (graph.getVertexCount) {
        nodeCount = graph.getVertexCount();
    }
    
    if (start < 0 || start >= nodeCount) {
        logMessage(`Start node must be between 0 and ${nodeCount - 1}`, 'error');
        return;
    }
    
    try {
        const result = graph.dijkstra(start);
        document.getElementById('graph-result').textContent = result;
        
        // For Dijkstra, we'll highlight all reachable nodes
        const distances = result.slice(1, -1).split(',').map(Number);
        currentGraphPath = distances.map((dist, index) => dist < 999999 ? index : -1)
                                  .filter(index => index !== -1);
        currentGraphType = 'dijkstra';
        
        logMessage(`Dijkstra distances: ${result}`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function runPrim() {
    if (!graph) {
        logMessage('Graph not initialized. Please initialize graph first.', 'error');
        return;
    }
    
    let isDirected = false;
    if (graph.getIsDirected && graph.getIsDirected()) {
        isDirected = true;
    }
    
    if (isDirected) {
        logMessage("Prim's algorithm requires an undirected graph", 'error');
        document.getElementById('graph-result').textContent = 'Prim requires undirected graph';
        return;
    }
    
    try {
        const result = graph.primMST();
        document.getElementById('graph-result').textContent = result;
        
        // Parse MST edges for highlighting
        const edges = result.slice(1, -1).split(',').filter(edge => edge.trim() !== '');
        currentGraphPath = [];
        edges.forEach(edge => {
            const [nodes, weight] = edge.split(':');
            const [u, v] = nodes.split('-').map(Number);
            currentGraphPath.push(u, v);
        });
        currentGraphType = 'prim';
        
        logMessage(`Prim's MST edges: ${result}`, 'success');
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

// Hash Table Operations
function insertHash() {
    if (!hashTable) {
        logMessage('Hash Table not initialized', 'error');
        return;
    }
    
    const key = parseInt(document.getElementById('hash-key').value);
    const value = parseInt(document.getElementById('hash-value').value);
    
    if (isNaN(key) || isNaN(value)) {
        logMessage('Please enter valid key and value', 'error');
        return;
    }
    
    try {
        hashTable.insert(key, value);
        logMessage(`Inserted key ${key} with value ${value}`, 'success');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function searchHash() {
    if (!hashTable) {
        logMessage('Hash Table not initialized', 'error');
        return;
    }
    
    const key = parseInt(document.getElementById('hash-key').value);
    
    if (isNaN(key)) {
        logMessage('Please enter a valid key', 'error');
        return;
    }
    
    try {
        const result = hashTable.search(key);
        document.getElementById('search-result').textContent = result;
        if (result !== -1) {
            logMessage(`Found key ${key}: value = ${result}`, 'success');
        } else {
            logMessage(`Key ${key} not found`, 'error');
        }
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

function clearHash() {
    if (!hashTable) {
        logMessage('Hash Table not initialized', 'error');
        return;
    }
    
    try {
        hashTable.clear();
        document.getElementById('search-result').textContent = '-';
        logMessage('Hash Table cleared', 'info');
        updateStateDisplays();
        updateVisualization();
    } catch (error) {
        logMessage(`Error: ${error.message}`, 'error');
    }
}

// Visualization functions
function updateVisualization() {
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    try {
        switch(currentDS) {
            case 'binaryHeap':
                visualizeBinaryHeap(ctx);
                break;
            case 'avlTree':
                visualizeAVLTree(ctx);
                break;
            case 'graph':
                visualizeGraph(ctx);
                break;
            case 'hashTable':
                visualizeHashTable(ctx);
                break;
            default:
                drawDefaultVisualization(ctx);
        }
    } catch (error) {
        console.error('Visualization error:', error);
        drawDefaultVisualization(ctx);
    }
}

function drawDefaultVisualization(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${currentDS.toUpperCase()} Visualization (C++ WebAssembly)`, 400, 50);
    
    ctx.font = '16px Arial';
    ctx.fillText('Data structure operations are executing in compiled C++ code', 400, 250);
    
    if (binaryHeap && currentDS === 'binaryHeap') {
        const heapArray = binaryHeap.getArray ? binaryHeap.getArray() : '[]';
        ctx.fillText(`Heap: ${heapArray}`, 400, 300);
    }
}

// Binary Heap Visualization
function visualizeBinaryHeap(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BINARY HEAP VISUALIZATION', 400, 40);
    
    try {
        if (!binaryHeap || !binaryHeap.getArray) {
            ctx.fillText('Heap not initialized', 400, 250);
            return;
        }
        
        const heapStr = binaryHeap.getArray();
        const heapArray = heapStr.slice(1, -1).split(',').filter(x => x.trim() !== '').map(Number);
        
        if (heapArray.length === 0) {
            ctx.fillText('Heap is empty', 400, 250);
            return;
        }
        
        ctx.font = '16px Arial';
        ctx.fillText(`Array: ${heapStr}`, 400, 80);
        
        const startX = 400;
        const startY = 150;
        const nodeRadius = 25;
        const levelHeight = 80;
        
        for (let i = 0; i < heapArray.length; i++) {
            const level = Math.floor(Math.log2(i + 1));
            const nodesInLevel = Math.pow(2, level);
            const positionInLevel = i + 1 - Math.pow(2, level);
            const x = startX + (positionInLevel - nodesInLevel/2 + 0.5) * 100;
            const y = startY + level * levelHeight;
            
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;
            
            if (leftChild < heapArray.length) {
                const childLevel = Math.floor(Math.log2(leftChild + 1));
                const childNodesInLevel = Math.pow(2, childLevel);
                const childPositionInLevel = leftChild + 1 - Math.pow(2, childLevel);
                const childX = startX + (childPositionInLevel - childNodesInLevel/2 + 0.5) * 100;
                const childY = startY + childLevel * levelHeight;
                
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + nodeRadius);
                ctx.lineTo(childX, childY - nodeRadius);
                ctx.stroke();
            }
            
            if (rightChild < heapArray.length) {
                const childLevel = Math.floor(Math.log2(rightChild + 1));
                const childNodesInLevel = Math.pow(2, childLevel);
                const childPositionInLevel = rightChild + 1 - Math.pow(2, childLevel);
                const childX = startX + (childPositionInLevel - childNodesInLevel/2 + 0.5) * 100;
                const childY = startY + childLevel * levelHeight;
                
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, y + nodeRadius);
                ctx.lineTo(childX, childY - nodeRadius);
                ctx.stroke();
            }
            
            // Green theme for binary heap
            ctx.fillStyle = '#2e8b57';
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(heapArray[i].toString(), x, y);
        }
        
    } catch (error) {
        console.error('Binary heap visualization error:', error);
        ctx.fillText('Error visualizing heap', 400, 250);
    }
}

// AVL Tree Visualization
function visualizeAVLTree(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('AVL TREE VISUALIZATION', 400, 40);
    
    try {
        if (!avlTree || !avlTree.getTree) {
            ctx.fillText('AVL Tree not initialized', 400, 250);
            return;
        }
        
        const treeStr = avlTree.getTree();
        const nodes = treeStr.slice(1, -1).split(',').filter(x => x.trim() !== '');
        
        if (nodes.length === 0) {
            ctx.fillText('Tree is empty', 400, 250);
            return;
        }
        
        const treeData = buildTreeFromInOrder(nodes);
        
        if (treeData) {
            drawTreeFromData(ctx, treeData);
        } else {
            drawBalancedTree(ctx, nodes);
        }
        
    } catch (error) {
        console.error('AVL tree visualization error:', error);
        ctx.fillText('Error visualizing AVL tree', 400, 250);
    }
}

function buildTreeFromInOrder(nodes) {
    if (nodes.length === 0) return null;
    
    const values = nodes.map(nodeStr => {
        const [value, height, balance] = nodeStr.split(':').map(Number);
        return { value, height, balance };
    });
    
    function buildBalancedBST(arr, start, end) {
        if (start > end) return null;
        
        const mid = Math.floor((start + end) / 2);
        const node = {
            value: arr[mid].value,
            height: arr[mid].height,
            balance: arr[mid].balance,
            left: buildBalancedBST(arr, start, mid - 1),
            right: buildBalancedBST(arr, mid + 1, end)
        };
        
        return node;
    }
    
    return buildBalancedBST(values, 0, values.length - 1);
}

function drawTreeFromData(ctx, root) {
    const startX = 400;
    const startY = 120;
    const nodeRadius = 22;
    const levelHeight = 70;
    const baseWidth = 150;
    
    let maxLevel = 0;
    
    function calculatePositions(node, x, y, level, horizontalSpread) {
        if (!node) return { x, leftExtent: x, rightExtent: x };
        
        maxLevel = Math.max(maxLevel, level);
        
        const currentHorizontalSpread = horizontalSpread * 0.7;
        
        const left = calculatePositions(node.left, x - currentHorizontalSpread, y + levelHeight, level + 1, currentHorizontalSpread);
        
        const currentX = (left.rightExtent + (node.right ? left.rightExtent + currentHorizontalSpread * 2 : left.rightExtent)) / 2;
        
        const right = calculatePositions(node.right, currentX + currentHorizontalSpread, y + levelHeight, level + 1, currentHorizontalSpread);
        
        node.x = currentX;
        node.y = y;
        node.level = level;
        
        return {
            x: currentX,
            leftExtent: left.leftExtent,
            rightExtent: right.rightExtent
        };
    }
    
    calculatePositions(root, startX, startY, 0, baseWidth);
    
    function drawConnections(node) {
        if (!node) return;
        
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 2;
        
        if (node.left) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y + nodeRadius);
            ctx.lineTo(node.left.x, node.left.y - nodeRadius);
            ctx.stroke();
            drawConnections(node.left);
        }
        
        if (node.right) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y + nodeRadius);
            ctx.lineTo(node.right.x, node.right.y - nodeRadius);
            ctx.stroke();
            drawConnections(node.right);
        }
    }
    
    drawConnections(root);
    
    function drawNodes(node) {
        if (!node) return;
        
        // Green theme for AVL tree
        const gradient = ctx.createRadialGradient(
            node.x - 5, node.y - 5, 5,
            node.x, node.y, nodeRadius
        );
        gradient.addColorStop(0, '#2e8b57');
        gradient.addColorStop(1, '#3cb371');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Root node gets a special border
        if (node.level === 0) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Mark unbalanced nodes with a dashed border
        if (node.balance < -1 || node.balance > 1) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value.toString(), node.x, node.y);
        
        ctx.fillStyle = '#2d3748';
        ctx.font = '10px Arial';
        ctx.fillText(`h:${node.height}`, node.x - 15, node.y + nodeRadius + 10);
        ctx.fillText(`b:${node.balance}`, node.x + 15, node.y + nodeRadius + 10);
        
        // Add warning symbol for unbalanced nodes
        if (node.balance < -1 || node.balance > 1) {
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('⚠', node.x, node.y - nodeRadius - 5);
        }
        
        drawNodes(node.left);
        drawNodes(node.right);
    }
    
    drawNodes(root);
    drawAVTLegend(ctx);
}

function drawBalancedTree(ctx, nodes) {
    const startX = 400;
    const startY = 150;
    const nodeRadius = 22;
    const levelHeight = 70;
    
    const values = nodes.map(nodeStr => {
        const [value, height, balance] = nodeStr.split(':').map(Number);
        return { value, height, balance };
    });
    
    function drawSimpleTree(values, x, y, level, spread) {
        if (values.length === 0) return;
        
        const mid = Math.floor(values.length / 2);
        const node = values[mid];
        const leftValues = values.slice(0, mid);
        const rightValues = values.slice(mid + 1);
        
        const currentSpread = spread * 0.6;
        
        if (leftValues.length > 0) {
            const leftX = x - currentSpread;
            const leftY = y + levelHeight;
            
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + nodeRadius);
            ctx.lineTo(leftX, leftY - nodeRadius);
            ctx.stroke();
            
            drawSimpleTree(leftValues, leftX, leftY, level + 1, currentSpread);
        }
        
        if (rightValues.length > 0) {
            const rightX = x + currentSpread;
            const rightY = y + levelHeight;
            
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y + nodeRadius);
            ctx.lineTo(rightX, rightY - nodeRadius);
            ctx.stroke();
            
            drawSimpleTree(rightValues, rightX, rightY, level + 1, currentSpread);
        }
        
        // Green theme for AVL tree
        const gradient = ctx.createRadialGradient(
            x - 5, y - 5, 5,
            x, y, nodeRadius
        );
        gradient.addColorStop(0, '#2e8b57');
        gradient.addColorStop(1, '#3cb371');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Root node gets a special border
        if (level === 0) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
        
        // Mark unbalanced nodes with a dashed border
        if (node.balance < -1 || node.balance > 1) {
            ctx.strokeStyle = '#e53e3e';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value.toString(), x, y);
        
        ctx.fillStyle = '#2d3748';
        ctx.font = '10px Arial';
        ctx.fillText(`h:${node.height}`, x - 15, y + nodeRadius + 10);
        ctx.fillText(`b:${node.balance}`, x + 15, y + nodeRadius + 10);
        
        // Add warning symbol for unbalanced nodes
        if (node.balance < -1 || node.balance > 1) {
            ctx.fillStyle = '#e53e3e';
            ctx.font = 'bold 12px Arial';
            ctx.fillText('⚠', x, y - nodeRadius - 5);
        }
    }
    
    drawSimpleTree(values, startX, startY, 0, 200);
    drawAVTLegend(ctx);
}

function drawAVTLegend(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Normal node
    ctx.fillStyle = '#2e8b57';
    ctx.beginPath();
    ctx.arc(50, 450, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#2d3748';
    ctx.fillText('Normal Node', 65, 453);
    
    // Root node
    ctx.fillStyle = '#2e8b57';
    ctx.beginPath();
    ctx.arc(200, 450, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#2d3748';
    ctx.fillText('Root Node', 215, 453);
    
    // Unbalanced node
    ctx.fillStyle = '#2e8b57';
    ctx.beginPath();
    ctx.arc(350, 450, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#e53e3e';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#e53e3e';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('⚠', 350, 450);
    ctx.fillStyle = '#2d3748';
    ctx.font = '12px Arial';
    ctx.fillText('Unbalanced Node', 365, 453);
}

// Graph Visualization
function visualizeGraph(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GRAPH VISUALIZATION', 400, 40);
    
    try {
        if (!graph) {
            ctx.fillText('Graph not initialized. Click "Initialize Graph" to start.', 400, 250);
            return;
        }
        
        let matrix = null;
        let nodeCount = 0;
        let isDirected = false;
        
        if (graph.getMatrix) {
            const matrixStr = graph.getMatrix();
            matrix = parseMatrix(matrixStr);
            if (matrix) {
                nodeCount = matrix.length;
            }
        }
        
        // Check if graph is directed
        if (graph.getIsDirected && graph.getIsDirected()) {
            isDirected = true;
        }
        
        // Update the node count display
        document.getElementById('graph-nodes').value = nodeCount;
        
        const centerX = 400;
        const centerY = 250;
        
        // Adjust radius based on node count for better visualization
        const baseRadius = 150;
        const radius = Math.max(80, Math.min(baseRadius, baseRadius - (nodeCount - 6) * 10));
        
        const nodePositions = [];
        for (let i = 0; i < nodeCount; i++) {
            const angle = (2 * Math.PI * i) / nodeCount;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            nodePositions.push({ x, y, index: i });
        }
        
        if (matrix) {
            drawGraphEdges(ctx, matrix, nodePositions, nodeCount, isDirected);
        }
        
        drawGraphNodes(ctx, nodePositions);
        
        // Show graph info
        ctx.fillStyle = '#4a5568';
        ctx.font = '14px Arial';
        ctx.fillText(`Nodes: ${nodeCount} | Type: ${isDirected ? 'Directed' : 'Undirected'}`, 400, 80);
        
        if (currentGraphType) {
            ctx.fillStyle = getGraphAlgorithmColor(currentGraphType);
            ctx.fillText(`Current Algorithm: ${currentGraphType.toUpperCase()}`, 400, 100);
        }
        
        if (!matrix || !hasEdges(matrix, nodeCount)) {
            ctx.fillStyle = '#a0aec0';
            ctx.font = '16px Arial';
            ctx.fillText('No edges added. Use "Add Edge" to connect nodes.', 400, 450);
        }
        
    } catch (error) {
        console.error('Graph visualization error:', error);
        ctx.fillText('Error visualizing graph', 400, 250);
    }
}

function drawGraphEdges(ctx, matrix, nodePositions, nodeCount, isDirected) {
    ctx.save();
    
    let hasEdges = false;
    
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
            if (matrix[i][j] !== 0) {
                hasEdges = true;
                const from = nodePositions[i];
                const to = nodePositions[j];
                
                // For undirected graphs, only draw once (i <= j)
                if (!isDirected && i > j) continue;
                
                if (i === j) {
                    drawSelfLoop(ctx, from, matrix[i][j], isDirected);
                } else {
                    if (isDirected) {
                        drawDirectedEdge(ctx, from, to, matrix[i][j]);
                    } else {
                        drawUndirectedEdge(ctx, from, to, matrix[i][j]);
                    }
                }
            }
        }
    }
    
    ctx.restore();
    return hasEdges;
}

function drawSelfLoop(ctx, node, weight, isDirected) {
    const loopRadius = 25;
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(node.x, node.y - loopRadius, loopRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw arrow for directed self-loop
    if (isDirected) {
        const arrowX = node.x;
        const arrowY = node.y - loopRadius * 2;
        drawArrowHead(ctx, arrowX, arrowY, Math.PI / 2);
    }
    
    // Weight label
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(node.x, node.y - loopRadius * 1.5, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weight.toString(), node.x, node.y - loopRadius * 1.5);
}

function drawDirectedEdge(ctx, from, to, weight) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate the actual start and end points (node boundaries)
    const nodeRadius = 20;
    const startX = from.x + (dx / distance) * nodeRadius;
    const startY = from.y + (dy / distance) * nodeRadius;
    const endX = to.x - (dx / distance) * nodeRadius;
    const endY = to.y - (dy / distance) * nodeRadius;
    
    // Draw the edge line
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrow head
    const angle = Math.atan2(dy, dx);
    drawArrowHead(ctx, endX, endY, angle);
    
    // Draw weight label
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weight.toString(), midX, midY);
}

function drawUndirectedEdge(ctx, from, to, weight) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    
    const controlOffset = 15;
    const controlX = midX + (dy / distance) * controlOffset;
    const controlY = midY - (dx / distance) * controlOffset;
    
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
    ctx.stroke();
    
    // Weight label
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(controlX, controlY, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weight.toString(), controlX, controlY);
}

function drawArrowHead(ctx, x, y, angle) {
    const headLength = 15;
    const headAngle = Math.PI / 6;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-headLength, headLength * Math.tan(headAngle));
    ctx.moveTo(0, 0);
    ctx.lineTo(-headLength, -headLength * Math.tan(headAngle));
    ctx.stroke();
    
    ctx.restore();
}

function drawGraphNodes(ctx, nodePositions) {
    ctx.save();
    
    const baseNodeRadius = 20;
    const nodeCount = nodePositions.length;
    const nodeRadius = Math.max(15, Math.min(baseNodeRadius, baseNodeRadius - (nodeCount - 6) * 1));
    const baseFontSize = 16;
    const fontSize = Math.max(12, Math.min(baseFontSize, baseFontSize - (nodeCount - 6) * 0.5));
    
    nodePositions.forEach(node => {
        // Check if node is in current path
        const isInPath = currentGraphPath.includes(node.index);
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(node.x + 2, node.y + 2, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        // Node color based on path
        let gradient;
        if (isInPath) {
            gradient = ctx.createRadialGradient(
                node.x - 5, node.y - 5, 5,
                node.x, node.y, nodeRadius
            );
            gradient.addColorStop(0, getGraphAlgorithmColor(currentGraphType, true));
            gradient.addColorStop(1, getGraphAlgorithmColor(currentGraphType, false));
        } else {
            gradient = ctx.createRadialGradient(
                node.x - 5, node.y - 5, 5,
                node.x, node.y, nodeRadius
            );
            gradient.addColorStop(0, '#2e8b57');
            gradient.addColorStop(1, '#3cb371');
        }
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = isInPath ? getGraphAlgorithmBorderColor(currentGraphType) : '#2d3748';
        ctx.lineWidth = isInPath ? 3 : 2.5;
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.index.toString(), node.x, node.y);
        
        // Add path indicator
        if (isInPath && currentGraphPath.length > 0) {
            const pathIndex = currentGraphPath.indexOf(node.index);
            if (pathIndex !== -1 && (currentGraphType === 'bfs' || currentGraphType === 'dfs')) {
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 12px Arial';
                ctx.fillText(`${pathIndex + 1}`, node.x, node.y - nodeRadius - 10);
            }
        }
    });
    
    ctx.restore();
}

function getGraphAlgorithmColor(algorithm, isLight = false) {
    switch(algorithm) {
        case 'bfs':
            return isLight ? '#68d391' : '#38a169';
        case 'dfs':
            return isLight ? '#63b3ed' : '#3182ce';
        case 'dijkstra':
            return isLight ? '#f6ad55' : '#dd6b20';
        case 'prim':
            return isLight ? '#9f7aea' : '#805ad5';
        default:
            return isLight ? '#2e8b57' : '#3cb371';
    }
}

function getGraphAlgorithmBorderColor(algorithm) {
    switch(algorithm) {
        case 'bfs':
            return '#2f855a';
        case 'dfs':
            return '#2c5282';
        case 'dijkstra':
            return '#c05621';
        case 'prim':
            return '#6b46c1';
        default:
            return '#2d3748';
    }
}

function parseMatrix(matrixStr) {
    try {
        const rows = matrixStr.slice(1, -1).split('],[');
        return rows.map(row => 
            row.replace(/[\[\]]/g, '').split(',').map(Number)
        );
    } catch (error) {
        console.error('Error parsing matrix:', error);
        return null;
    }
}

function hasEdges(matrix, nodeCount) {
    for (let i = 0; i < nodeCount; i++) {
        for (let j = 0; j < nodeCount; j++) {
            if (matrix[i][j] !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Hash Table Visualization
function visualizeHashTable(ctx) {
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HASH TABLE VISUALIZATION', 400, 40);
    
    try {
        if (!hashTable || !hashTable.getTable) {
            ctx.fillText('Hash Table not initialized', 400, 250);
            return;
        }
        
        const tableStr = hashTable.getTable();
        
        // Parse the table string to get buckets
        const buckets = tableStr.slice(1, -1).split('],[').map(bucket => 
            bucket.replace(/[\[\]]/g, '').split(',').filter(x => x.trim() !== '')
        );
        
        const startX = 100;
        const startY = 120;
        const bucketWidth = 120;
        const bucketHeight = 40;
        const horizontalSpacing = 20;
        const verticalSpacing = 60;
        const bucketsPerRow = 5;
        
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Table State: ${tableStr}`, 50, 80);
        
        buckets.forEach((bucket, index) => {
            const row = Math.floor(index / bucketsPerRow);
            const col = index % bucketsPerRow;
            const x = startX + col * (bucketWidth + horizontalSpacing);
            const y = startY + row * (bucketHeight + verticalSpacing);
            
            // Draw bucket background
            ctx.fillStyle = '#f7fafc';
            ctx.fillRect(x, y, bucketWidth, bucketHeight);
            
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, bucketWidth, bucketHeight);
            
            // Draw bucket index
            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Bucket ${index}`, x + bucketWidth/2, y - 10);
            
            if (bucket.length > 0) {
                // Draw key-value pairs
                ctx.fillStyle = '#9f7aea';
                ctx.font = '12px Arial';
                
                if (bucket.length === 1) {
                    // Single item - center it
                    ctx.fillText(bucket[0], x + bucketWidth/2, y + bucketHeight/2);
                } else {
                    // Multiple items - distribute vertically
                    const itemHeight = bucketHeight / bucket.length;
                    bucket.forEach((kv, kvIndex) => {
                        const itemY = y + (kvIndex * itemHeight) + (itemHeight / 2);
                        ctx.fillText(kv, x + bucketWidth/2, itemY);
                    });
                }
            } else {
                ctx.fillStyle = '#a0aec0';
                ctx.font = '12px Arial';
                ctx.fillText('Empty', x + bucketWidth/2, y + bucketHeight/2);
            }
        });
        
        // Draw legend for large tables
        if (buckets.length > 10) {
            ctx.fillStyle = '#4a5568';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Scroll down to see all buckets →', 400, 450);
        }
        
    } catch (error) {
        console.error('Hash table visualization error:', error);
        ctx.fillText('Error visualizing hash table', 400, 250);
    }
}

// Clean up
window.addEventListener('beforeunload', function() {
    if (binaryHeap && binaryHeap.delete) binaryHeap.delete();
    if (avlTree && avlTree.delete) avlTree.delete();
    if (graph && graph.delete) graph.delete();
    if (hashTable && hashTable.delete) hashTable.delete();
});