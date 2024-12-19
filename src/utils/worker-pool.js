/**
 * Worker Pool for parallel physics calculations
 */

import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class WorkerPool {
    constructor(size = 4) {
        this.size = size;
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;

        // Initialize workers
        for (let i = 0; i < size; i++) {
            const worker = new Worker(join(__dirname, 'physics-worker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this));
            worker.on('error', this.handleWorkerError.bind(this));
            this.workers.push(worker);
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
            worker.postMessage(taskWrapper.task);
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
        this.workers.forEach(worker => worker.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
    }
}
