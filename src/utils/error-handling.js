/**
 * Error handling utilities
 * @module error-handling
 */

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

/**
 * Custom error class for calculation errors
 */
export class CalculationError extends Error {
    constructor(message, details) {
        super(message);
        this.name = 'CalculationError';
        this.details = details;
    }
}

/**
 * Custom error class for API errors
 */
export class APIError extends Error {
    constructor(message, status, endpoint) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.endpoint = endpoint;
    }
}

/**
 * Handle errors globally
 * @param {Error} error - Error to handle
 * @returns {Object} Error details for UI
 */
export function handleError(error) {
    console.error('Error:', error);
    
    // Default error response
    const response = {
        message: 'An unexpected error occurred',
        type: 'error',
        field: null,
        details: null
    };
    
    if (error instanceof ValidationError) {
        response.message = error.message;
        response.type = 'validation';
        response.field = error.field;
    }
    else if (error instanceof CalculationError) {
        response.message = error.message;
        response.type = 'calculation';
        response.details = error.details;
    }
    else if (error instanceof APIError) {
        response.message = `API Error: ${error.message}`;
        response.type = 'api';
        response.details = {
            status: error.status,
            endpoint: error.endpoint
        };
    }
    
    return response;
}

/**
 * Show error message in UI
 * @param {Object} errorDetails - Error details
 */
export function showErrorMessage(errorDetails) {
    const errorContainer = document.getElementById('error-container');
    if (!errorContainer) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = `alert alert-${getErrorClass(errorDetails.type)}`;
    errorElement.textContent = errorDetails.message;
    
    // Add field-specific error styling
    if (errorDetails.field) {
        const field = document.querySelector(`[name="${errorDetails.field}"]`);
        if (field) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
        }
    }
    
    errorContainer.appendChild(errorElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorElement.remove();
        
        // Remove field error styling
        if (errorDetails.field) {
            const field = document.querySelector(`[name="${errorDetails.field}"]`);
            if (field) {
                field.classList.remove('error');
                field.removeAttribute('aria-invalid');
            }
        }
    }, 5000);
}

/**
 * Get error class for UI styling
 * @param {string} errorType - Type of error
 * @returns {string} CSS class
 */
function getErrorClass(errorType) {
    switch (errorType) {
        case 'validation':
            return 'warning';
        case 'calculation':
            return 'danger';
        case 'api':
            return 'danger';
        default:
            return 'danger';
    }
}

/**
 * Handle offline state
 * @returns {void}
 */
export function handleOffline() {
    const offlineMessage = document.getElementById('offline-message');
    if (offlineMessage) {
        offlineMessage.style.display = 'block';
    }
    
    // Disable weather-dependent features
    const weatherElements = document.querySelectorAll('[data-requires-online]');
    weatherElements.forEach(element => {
        element.disabled = true;
        element.setAttribute('title', 'This feature requires an internet connection');
    });
}

/**
 * Handle online state
 * @returns {void}
 */
export function handleOnline() {
    const offlineMessage = document.getElementById('offline-message');
    if (offlineMessage) {
        offlineMessage.style.display = 'none';
    }
    
    // Re-enable weather-dependent features
    const weatherElements = document.querySelectorAll('[data-requires-online]');
    weatherElements.forEach(element => {
        element.disabled = false;
        element.removeAttribute('title');
    });
}
