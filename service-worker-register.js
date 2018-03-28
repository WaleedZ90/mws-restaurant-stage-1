if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            })
            .then((response) => {
                console.log('Service worker registered successfully!', response);
            })
            .catch((error) => {
                console.log('Service worker failed to register!', error);
            });
    });
}
else {
    console.warn('Your browser doesn\'t support service workers.');
}