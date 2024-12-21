/**
 * Worker Pool for parallel physics calculations
 */

// Import worker threads polyfill
import Worker from 'worker_threads';
import { parse, format } from 'url';
import path from 'path';

const __filename = typeof document === 'undefined' ? new URL(import.meta.url).pathname : '';
const __dirname = typeof document === 'undefined' ? path.dirname(__filename) : '';

export class WorkerPool {
    constructor(size = 4) {
        this.size = size;
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < this.size; i++) {
            const worker = new Worker(path.join(__dirname, 'physics-worker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this));
            worker.on('error', this.handleWorkerError.bind(this));
            this.workers.push({
                worker,
                busy: false,
                currentTask: null
            });
        }
    }

    async executeTask(task) {
        return new Promise((resolve, reject) => {
            const taskWrapper = {
                task,
                resolve,
                reject
            };

            if (this.activeWorkers < this.size) {
                this.assignTaskToWorker(taskWrapper);
            } else {
                this.taskQueue.push(taskWrapper);
            }
        });
    }

    assignTaskToWorker(taskWrapper) {
        const worker = this.workers.find(w => !w.busy);
        if (worker) {
            worker.busy = true;
            this.activeWorkers++;
            worker.worker.postMessage(taskWrapper.task);
            worker.currentTask = taskWrapper;
        }
    }

    handleWorkerMessage(message) {
        const worker = this.workers.find(w => w.currentTask);
        if (worker) {
            const { resolve } = worker.currentTask;
            worker.busy = false;
            worker.currentTask = null;
            this.activeWorkers--;
            resolve(message);

            // Process next task in queue
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift();
                this.assignTaskToWorker(nextTask);
            }
        }
    }

    handleWorkerError(error) {
        const worker = this.workers.find(w => w.currentTask);
        if (worker) {
            const { reject } = worker.currentTask;
            worker.busy = false;
            worker.currentTask = null;
            this.activeWorkers--;
            reject(error);

            // Process next task in queue
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift();
                this.assignTaskToWorker(nextTask);
            }
        }
    }

    terminate() {
        this.workers.forEach(worker => worker.worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
    }
}
