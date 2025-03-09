const PORT=3000;
const MAX_PROTEIN_LENGTH=200;

const express = require('express');
const app = express();
const fs= require('fs');
const {v4: uuidv4}= require('uuid');

const propensityTable = {
    "A": { H: 1.42, E: 0.83, C: 0.80 },
    "R": { H: 1.21, E: 0.84, C: 0.96 },
    "N": { H: 0.67, E: 0.89, C: 1.34 },
    "D": { H: 1.01, E: 0.54, C: 1.35 },
    "C": { H: 0.70, E: 1.19, C: 1.06 },
    "Q": { H: 1.11, E: 1.10, C: 0.84 },
    "E": { H: 1.51, E: 0.37, C: 1.08 },
    "G": { H: 0.57, E: 0.75, C: 1.56 },
    "I": { H: 1.08, E: 1.60, C: 0.47 },
    "L": { H: 1.21, E: 1.30, C: 0.59 },
    "K": { H: 1.16, E: 0.74, C: 1.07 },
    "M": { H: 1.45, E: 1.05, C: 0.60 },
    "F": { H: 1.13, E: 1.38, C: 0.59 },
    "P": { H: 0.57, E: 0.55, C: 1.72 },
    "S": { H: 0.77, E: 0.75, C: 1.39 },
    "T": { H: 0.83, E: 1.19, C: 0.96 },
    "W": { H: 1.08, E: 1.37, C: 0.64 },
    "Y": { H: 0.69, E: 1.47, C: 0.87 },
    "V": { H: 1.06, E: 1.70, C: 0.41 }
};

app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

app.use(errorHandler);

class NotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConflictError';
    }
}

function readProteinData(callback) {
    fs.readFile('data/proteins.json', 'utf8', (err, data) => {
        if (err) {
            return callback({ error: 'Error reading proteins data' });
        }
        callback(null, JSON.parse(data));
    });
}

function errorHandler(err, req, res, next) {
    console.error(err);
    if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
    } else if (err instanceof ConflictError) {
        res.status(409).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Internal server error' });
    }
}

function writeProteinData(proteins, callback) {
    fs.writeFile('data/proteins.json', JSON.stringify(proteins, null, 2), (err) => {
        if (err) {
            return callback({ error: 'Error writing protein data' });
        }
        callback(null);
    });
}

function createProtein(name, sequence, description) {
    return {
        id: uuidv4(), 
        name: name || '', 
        sequence: sequence,
        molecularWeight: calculateMolecularWeight(sequence),
        description: description || '', 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

function calculateMolecularWeight(sequence) {
    const aminoAcids = {
        A: 89.1, C: 121.2, D: 133.1, E: 147.1, F: 165.2, G: 75.1, H: 155.2, I: 131.2,
        K: 146.2, L: 131.2, M: 149.2, N: 132.1, P: 115.1, Q: 146.2, R: 174.2, S: 105.1,
        T: 119.1, V: 117.1, W: 204.2, Y: 181.2
    };

    let weight = 0;
    for (let i = 0; i < sequence.length; i++) {
        const aminoAcid = sequence[i];
        weight += aminoAcids[aminoAcid] || 0; 
    }
    if (weight <= 0) {
        throw new Error("Invalid sequence or molecular weight is not positive");
    }
    return weight;
}

function validateSequence(sequence) {
    return /^[A-IK-MN-PRSTVWY]{20,2000}$/.test(sequence); 
}

function predictStructure(sequence) {
    const structure = [];
    const confidenceScores = [];

    for (let i = 0; i < sequence.length; i++) {
        const aa = sequence[i]; 
        const propensity = propensityTable[aa];

        if (!propensity) {
            structure.push("C");  
            confidenceScores.push(0);
            continue;
        }

        const scores = Object.values(propensity);
        const maxScore = Math.max(...scores);
        const maxScoreIndex = scores.indexOf(maxScore);

        const structureTypes = ['H', 'E', 'C'];
        const predictedStructure = structureTypes[maxScoreIndex];

        const secondMaxScore = Math.max(...scores.filter(score => score !== maxScore));
        const confidence = (maxScore - secondMaxScore) / maxScore;

        structure.push(predictedStructure);
        confidenceScores.push(confidence);
    }

    return { structure: structure.join(''), confidenceScores };
}

function populateExtraFields(proteinData) {
    if (!proteinData.molecularWeight && proteinData.sequence) {
        proteinData.molecularWeight = calculateMolecularWeight(proteinData.sequence);
    }
    return proteinData;
}


app.get('/api/proteins', (req, res) => {
    let { limit, offset } = req.query;

    limit = limit ? parseInt(limit) : undefined;
    offset = offset ? parseInt(offset) : undefined;

    if ((limit && isNaN(limit)) || (offset && isNaN(offset))) {
        return res.status(400).json({
            error: 'Invalid query parameters',
            details: {
                limit: 'must be a positive integer',
                offset: 'must be a non-negative integer'
            }
        });
    }

    readProteinData((err, proteins) => {
        if (err) {
            return res.status(500).json(err);
        }

        const start = offset || 0;
        const end = limit ? start + limit : proteins.length;

        if (start >= proteins.length) {
            return res.status(400).json({
                error: 'Invalid query parameters',
                details: {
                    offset: 'cannot exceed total number of proteins'
                }
            });
        }

        const paginatedProteins = proteins.slice(start, end);
        res.status(200).json({
            proteins: paginatedProteins,
            total: proteins.length,
            limit: limit || proteins.length,
            offset: offset || 0
        });
    });
});


app.post('/api/proteins', (req, res, next) => {
    const { name, sequence, description } = req.body;

    if (!sequence || !validateSequence(sequence)) {
        return res.status(400).json({
            error: 'Invalid sequence data',
            details: {
                sequence: 'must be a string (20-2000 uppercase characters)'
            }
        });
    }

    if (name && (name.length < 1 || name.length > 100)) {
        return res.status(400).json({
            error: 'Invalid name data',
            details: {
                name: 'must be between 1 and 100 characters long'
            }
        });
    }

    try {
        const existingProtein = getProteinSync(req.body.id);  
        if (existingProtein) {
            throw new ConflictError(`Protein with ID ${req.body.id} already exists`);
        }
    } catch (error) {
        if (!(error instanceof NotFoundError)) {
            return next(error);
        }
    }

    if (description && description.length > 1000) {
        return res.status(400).json({
            error: 'Invalid description data',
            details: {
                description: 'must not exceed 1000 characters'
            }
        });
    }

    const newProtein = createProtein(name, sequence, description);
    const populatedProtein = populateExtraFields(newProtein);

    fs.readFile('data/proteins.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }

        const proteins = JSON.parse(data || '[]'); 
        proteins.push(populatedProtein); 

        fs.writeFile('data/proteins.json', JSON.stringify(proteins, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing proteins data' });
            }

            res.status(201).json(populatedProtein);
        });
    });
});

app.get('/api/proteins/:proteinId', (req, res) => {
    const { proteinId } = req.params; 

    readProteinData((err, proteins) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }

        const protein = proteins.find(p => p.id === proteinId);

        if (!protein) {
            return res.status(404).json({
                error: 'Protein not found',
                details: { proteinId: `No protein found with id ${proteinId}` }
            });
        }

        res.status(200).json(protein);
    });
});

app.post('/api/proteins/sequence', (req, res, next) => {
    const sequence = req.body.trim(); 

    if (!sequence || !/^[A-IK-MN-PRSTVWY]{20,2000}$/.test(sequence)) {
        return res.status(400).json({
            error: 'Invalid sequence data',
            details: {
                sequence: 'must be a string (20-2000 uppercase characters)'
            }
        });
    }

    try {
        const existingProtein = getProteinSync(sequence); 
        if (existingProtein) {
            throw new ConflictError(`Protein with sequence ${sequence} already exists`);
        }
    } catch (error) {
        if (!(error instanceof NotFoundError)) {
            return next(error);
        }
    }

    const name = `Protein_${sequence.slice(0, 8)}_${Math.floor(Date.now() / 1000)}`;

    const newProtein = {
        id: uuidv4(), 
        name: name,
        sequence: sequence,
        molecularWeight: calculateMolecularWeight(sequence), 
        description: "", 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    fs.readFile('data/proteins.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }

        const proteins = JSON.parse(data || '[]'); 
        proteins.push(newProtein); 

        fs.writeFile('data/proteins.json', JSON.stringify(proteins, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing proteins data' });
            }

            res.status(201).json(newProtein);
        });
    });
});

app.put('/api/proteins/:proteinId', (req, res, next) => {
    const { proteinId } = req.params;
    const { name, description } = req.body;

    if (name && (name.length < 1 || name.length > 100) || name=="") {
        return res.status(400).json({
            error: 'Invalid name data',
            details: {
                name: 'must be between 1 and 100 characters long'
            }
        });
    }

    if (description && description.length > 1000) {
        return res.status(400).json({
            error: 'Invalid description data',
            details: {
                description: 'must not exceed 1000 characters'
            }
        });
    }

    try {
        const protein = getProteinSync(proteinId); 
        if (!protein) {
            throw new NotFoundError(`Protein with id ${proteinId} not found`);
        }
    } catch (error) {
        return next(error);
    }

    readProteinData((err, proteins) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }

        const proteinIndex = proteins.findIndex(p => p.id === proteinId);

        if (proteinIndex === -1) {
            return res.status(404).json({
                error: 'Protein not found',
                details: { proteinId: `No protein found with id ${proteinId}` }
            });
        }

        if (name) {
            proteins[proteinIndex].name = name;
        }
        if (description) {
            proteins[proteinIndex].description = description;
        }

        proteins[proteinIndex].updatedAt = new Date().toISOString();

        const updatedProtein = populateExtraFields(proteins[proteinIndex]);

        fs.writeFile('data/proteins.json', JSON.stringify(proteins, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing proteins data' });
            }

            console.log("Updated Protein Data:", proteins[proteinIndex]);
            res.status(200).json(updatedProtein);
        });
    });
});

app.delete('/api/proteins/:proteinId', (req, res, next) => {
    const { proteinId } = req.params;  

    try {
        const protein = getProteinSync(proteinId); 
        if (!protein) {
            throw new NotFoundError(`Protein with id ${proteinId} not found`);
        }
    } catch (error) {
        return next(error); 
    }

    readProteinData((err, proteins) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }
        const proteinIndex = proteins.findIndex(p => p.id === proteinId);

        if (proteinIndex === -1) {
            return res.status(404).json({
                error: 'Protein not found',
                details: { proteinId: `No protein found with id ${proteinId}` }
            });
        }
        proteins.splice(proteinIndex, 1);
        fs.writeFile('data/proteins.json', JSON.stringify(proteins, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Error writing proteins data' });
            }
            res.status(204).end();
        });
    });
});

app.get('/api/proteins/:proteinId/structure', (req, res) => {
    const { proteinId } = req.params;
    const acceptHeader = req.headers.accept;
    readProteinData((err, proteins) => {
        if (err) {
            return res.status(500).json({ error: 'Error reading proteins data' });
        }

        const protein = proteins.find(p => p.id === proteinId);
        if (!protein) {
            return res.status(404).json({
                error: 'Protein not found',
                details: { proteinId: `No protein found with id ${proteinId}` }
            });
        }

        const { structure, confidenceScores } = predictStructure(protein.sequence);

        if (acceptHeader === 'application/json') {
            const proteinStructure = {
                proteinId: protein.id,
                sequence: protein.sequence, 
                secondaryStructure: structure,
                confidenceScores: confidenceScores
            };
            res.status(200).json(proteinStructure);
            
        } else if (acceptHeader === 'image/svg+xml') {
            const svgStructure = generateSVG(structure);
            res.status(200).header('Content-Type', 'image/svg+xml').send(svgStructure);
        } else {
            res.status(406).json({
                error: 'Requested content type not available',
                details: { acceptHeader: acceptHeader }
            });
        }
    });
});

function generateSVG(structure) {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="100">`;
    let x = 10;

    for (let i = 0; i < structure.length; i++) {
        const color = structure[i] === 'H' ? 'red' : structure[i] === 'E' ? 'blue' : 'green'; 
        svg += `<rect x="${x}" y="20" width="15" height="60" fill="${color}" />`;
        x += 20;
    }

    svg += '</svg>';
    return svg;
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});