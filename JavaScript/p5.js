document.addEventListener('DOMContentLoaded', function() {
    const trainingDataInput = document.getElementById('training-data');
    const btnBuildTree = document.getElementById('buildtree');
    const treeSection = document.getElementById('tree-section');
    const treeVisualization = document.getElementById('tree-visualization');
    const testSection = document.getElementById('test-section');
    const testDataInput = document.getElementById('test-data');
    const btnRunTest = document.getElementById('runtest');
    const resultSection = document.getElementById('result');
    const decisionPathElem = document.getElementById('decision-path');
    const finalDecisionElem = document.getElementById('final-decision');

    let decisionTree = null;
    let attrs = [];
    let targetAttr = '';

    btnBuildTree.addEventListener('click', handleBuildTree);
    btnRunTest.addEventListener('click', handleRunTest);

    function parseCSV(txt) {
        let lines = txt.trim().split('\n');
        let headers = lines[0].split(',').map(h => h.trim());
        let data = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            let vals = lines[i].split(',').map(x => x.trim());
            let entry = {};

            headers.forEach((header, i) => {
                entry[header] = vals[i];
            });
            data.push(entry);
        }
        return {headers, data};
    }

    function handleBuildTree() {
        let txt = trainingDataInput.value;
        if (!txt.trim()) {
            alert('You should enter training CSV-data first!');
            return;
        }

        try {
            let {headers, data} = parseCSV(txt);
            if (headers.length < 2 || data.length === 0) {
                alert('Invalid data format. Please ensure you have headers and at least one data row.');
                return;
            }

            targetAttr = headers.at(-1);
            attrs = headers.slice(0, -1);

            decisionTree = buildDecisionTree(data, attrs, targetAttr);
            visualizeTree(decisionTree);

            treeSection.style.display = 'block';
            testSection.style.display = 'block';

            resultSection.style.display = 'none';
        }
        catch (error) {
            console.error('Error building tree: ', error);
            alert('Error while building decision tree. Please proceed to console for details.');
        }
    }

    function buildDecisionTree(data, atts, target) {
        let targetVals = [...new Set(data.map(x => x[targetAttr]))];

        if (targetVals.length === 1) {
            return {
                type: 'leaf',
                value: targetVals[0]
            };
        }
        if (attrs.length === 0) {
            let valueCounts = {};
            data.forEach(x => {
                let val = x[targetAttr];
                valueCounts[val] = (valueCounts[val] || 0) + 1;
            });
            let mostCommon = null;
            let mx = 0;
            for ([val, k] of Object.entries(valueCounts)) {
                if (k > mx) {
                    mx = k;
                    mostCommon = val;
                }
            }
            return {
                type: 'leaf',
                value: mostCommon
            };
        }
        let bestAttr = findBestAttribute(data, attrs, targetAttr);
        
        const node = {
            type: 'decision',
            attr: bestAttr,
            branches: {}
        };
        let attrVals = [...new Set(data.map(x => x[bestAttr]))];
        attrVals.forEach(val => {
            let filteredData = data.filter(x => x[bestAttr] === val);
            if (filteredData.length === 0) {
                let valueCounts = {};
                data.forEach(x => {
                    let targetValue = x[targetAttr];
                    valueCounts[targetValue] = (valueCounts[targetValue] || 0) + 1;
                });
                let mostCommon = null;
                let mx = 0;
                for ([targetVal, k] of Object.entries(valueCounts)) {
                    if (k > mx) {
                        mx = k;
                        mostCommon = targetVal;
                    }
                }
                node.branches[val] = {
                    type: 'leaf',
                    value: mostCommon
                };
            }
            else {
                let remainingAttrs = attrs.filter(a => a !== bestAttr);
                node.branches[val] = buildDecisionTree(filteredData, remainingAttrs, targetAttr);
            }
        });
        return node;
    }

    function findBestAttribute(data, attrs, targetAttr) {
        let entropyBeforeSplit = calculateEntropy(data, targetAttr);
        let maxInfoGain = -Infinity;
        let bestAttr = null;

        attrs.forEach(a => {
            let infoGain = calculateInfoGain(data, a, targetAttr, entropyBeforeSplit);
            if (infoGain > maxInfoGain) {
                maxInfoGain = infoGain;
                bestAttr = a;
            }
        });
        return bestAttr;
    }

    function calculateEntropy(data, targetAttr) {
        let valueCounts = {};
        let total = data.length;

        data.forEach(x => {
            let value = x[targetAttr];
            valueCounts[value] = (valueCounts[value] || 0) + 1;
        });
        let entropy = 0;
        for (count of Object.values(valueCounts)) {
            let prob = count / total;
            entropy -= prob * Math.log2(prob);
        }
        return entropy;
    }

    function calculateInfoGain(data, attr, targetAttr, entropyBeforeSplit) {
        let attrVals = [...new Set(data.map(x => x[attr]))];
        let total = data.length;
        let entropyAfterSplit = 0;

        attrVals.forEach(val => {
            let filteredData = data.filter(x => x[attr] === val);
            let proportion = filteredData.length / total;
            
            let entropy = calculateEntropy(filteredData, targetAttr);
            entropyAfterSplit += proportion * entropy;
        });
        return entropyBeforeSplit - entropyAfterSplit;
    }

    function visualizeTree(tree) {
        treeVisualization.innerHTML = '';

        let treeContainer = document.createElement('div');
        treeContainer.className = 'tree-diagram';
        treeVisualization.appendChild(treeContainer);

        let root = createTreeNode(tree);
        treeContainer.appendChild(root);

        treeContainer.style.position = 'relative';
        treeContainer.style.minHeight = '100px';
        treeContainer.style.padding = '20px';
        treeContainer.style.overflowX = 'auto';
    }

    function createTreeNode(node, parentId = null, branch = null) {
        let nodeContainer = document.createElement('div');
        nodeContainer.className = 'tree-node-container';

        nodeContainer.style.display = 'flex';
        nodeContainer.style.flexDirection = 'column';
        nodeContainer.style.alignItems = 'center';
        nodeContainer.style.margin = '5px';
        nodeContainer.style.padding = '5px';

        let nodeElem = document.createElement('div');
        nodeElem.className = `node ${node.type === 'leaf' ? 'leaf' : ''}`;
        nodeElem.id = 'node-' + Math.random().toString(36).substr(2, 9);

        if (node.type === 'leaf') nodeElem.textContent = `Decision: ${node.value}`;
        else nodeElem.textContent = `${node.attr}?`;

        if (branch !== null) {
            let branchLabel = document.createElement('div');
            branchLabel.className = 'branch-label';
            branchLabel.textContent = branch;

            branchLabel.style.textAlign = 'center';
            branchLabel.style.marginBottom = '5px';
            branchLabel.style.fontWeight = 'bold';
            nodeContainer.appendChild(branchLabel);
        }
        nodeContainer.appendChild(nodeElem);

        if (node.type === 'decision') {
            let branchesContainer = document.createElement('div');
            branchesContainer.className = 'branches-container';

            branchesContainer.style.display = 'flex';
            branchesContainer.style.justifyContent = 'center';
            branchesContainer.style.marginTop = '10px';
            branchesContainer.style.gap = '5px';

            for ([val, child] of Object.entries(node.branches)) {
                let childElem = createTreeNode(child, nodeElem.id, val);
                branchesContainer.appendChild(childElem);
            }
            nodeContainer.appendChild(branchesContainer);
        }
        return nodeContainer;
    }

    function handleRunTest() {
        if (!decisionTree) {
            alert('Please build a decision tree first');
            return;
        }

        let testData = testDataInput.value.trim();
        if (!testData) {
            alert('Please enter test data first');
            return;
        }

        try {
            let testRows = testData.split('\n');
            let testRes = [];
            for (let row of testRows) {
                if (!row.trim()) continue;

                let vals = row.split(',').map(x => x.trim());
                let testInstance = {};
                attrs.forEach((a, i) => {
                    if (i < vals.length) testInstance[a] = vals[i];
                });
                let {decision, path} = classifyInstance(testInstance, decisionTree);
                testRes.push({
                    instance: testInstance, decision, path
                });
            }
            if (testRes.length > 0) {
                displayDecisionPath(testRes[0]);
                resultSection.style.display = 'block';
            }
        }
        catch (error) {
            console.error('Error running test:', error);
            alert('Error while running test. Please proceed to console for details');
        }
    }

    function classifyInstance(instance, tree, path = []) {
        if (tree.type === 'leaf') {
            return {
                decision: tree.value, path
            };
        }
        let attrVal = instance[tree.attr];
        path.push({
            attr: tree.attr,
            value: attrVal
        });

        if (!tree.branches[attrVal]) {
            let firstBranch = Object.keys(tree.branches)[0];
            return classifyInstance(instance, tree.branches[firstBranch], path);
        }
        return classifyInstance(instance, tree.branches[attrVal], path);
    }

    function displayDecisionPath(res) {
        decisionPathElem.innerHTML = '<h3>Decision Path: </h3>';
        res.path.forEach((step, i) => {
            let stepElem = document.createElement('div');
            stepElem.className = 'path-step';
            stepElem.textContent = `Step ${i + 1}: Check "${step.attr}" = "${step.value}"`;
            decisionPathElem.appendChild(stepElem);
        });
        finalDecisionElem.textContent = `Final Decision: ${res.decision}`;
    }
});