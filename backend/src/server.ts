// FIX: Using Request and Response types directly from express to ensure correct type inference.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readDb, writeDb, DbData } from './db.js';
import { PostIt, PostItComment, User } from './types.js';

// Augment Express's Request type to include our 'db' property
declare global {
  namespace Express {
    interface Request {
      db: DbData;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to load the database for each request
const dbMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        req.db = await readDb();
        next();
    } catch (error) {
        next(error);
    }
};

// Apply middleware to API routes only
app.use('/api', dbMiddleware);

// Endpoint to get all data at once
app.get('/api/data', (req: Request, res: Response) => {
    res.json(req.db);
});

// Login endpoint
app.post('/api/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const user = req.db.users.find((u: User) => u.username === username && u.password === password);
    if (user) {
        // Exclude password from the response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Generic CRUD endpoints factory
const createCrudEndpoints = <K extends keyof Omit<DbData, 'buildingName'>>(resource: K) => {
    const router = express.Router();
    
    type ItemType = DbData[K][number];
    type ItemWithId = ItemType & { id: number };

    // GET all
    router.get('/', (req: Request, res: Response) => {
        res.json(req.db[resource]);
    });

    // POST new
    router.post('/', async (req: Request, res: Response) => {
        const newItem = { ...req.body, id: Date.now() };
        (req.db[resource] as ItemType[]).push(newItem);
        await writeDb(req.db);
        res.status(201).json(newItem);
    });

    // PUT update
    router.put('/:id', async (req: Request, res: Response) => {
        const id = parseInt(req.params.id, 10);
        const updatedItemData = req.body;
        const items = req.db[resource] as ItemWithId[];
        const index = items.findIndex((item: ItemWithId) => item.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        items[index] = { ...items[index], ...updatedItemData, id };
        await writeDb(req.db);
        res.json(items[index]);
    });
    
    // DELETE item
    router.delete('/:id', async (req: Request, res: Response) => {
        const id = parseInt(req.params.id, 10);
        const items = req.db[resource] as ItemWithId[];
        const initialLength = items.length;
        
        (req.db as any)[resource] = items.filter((item: ItemWithId) => item.id !== id);
        
        if ((req.db[resource] as ItemWithId[]).length === initialLength) {
            return res.status(404).json({ message: 'Resource not found' });
        }
        
        await writeDb(req.db);
        res.status(204).send();
    });

    return router;
};

// --- Special Endpoints ---

// Post-it specific comment endpoint
app.post('/api/postIts/:id/comments', async (req: Request, res: Response) => {
    const postItId = parseInt(req.params.id, 10);
    const postIt = req.db.postIts.find((p: PostIt) => p.id === postItId);

    if (!postIt) {
        return res.status(404).json({ message: 'Post-it not found' });
    }
    const newComment: PostItComment = { ...req.body, id: Date.now(), createdAt: new Date().toISOString() };
    postIt.comments.push(newComment);
    postIt.comments.sort((a: PostItComment, b: PostItComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    await writeDb(req.db);
    res.status(201).json(newComment);
});

// Building Name endpoint
app.put('/api/buildingName', async (req: Request, res: Response) => {
    const { name } = req.body;
    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ message: 'Invalid name provided' });
    }
    req.db.buildingName = name.trim();
    await writeDb(req.db);
    res.json({ name: req.db.buildingName });
});

// Registering all CRUD routes
app.use('/api/users', createCrudEndpoints('users'));
app.use('/api/roles', createCrudEndpoints('roles'));
app.use('/api/apartments', createCrudEndpoints('apartments'));
app.use('/api/taskTypes', createCrudEndpoints('taskTypes'));
app.use('/api/assignments', createCrudEndpoints('assignments'));
app.use('/api/checkIns', createCrudEndpoints('checkIns'));
app.use('/api/workOrders', createCrudEndpoints('workOrders'));
app.use('/api/logbookEntries', createCrudEndpoints('logbookEntries'));
app.use('/api/postIts', createCrudEndpoints('postIts'));

// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
