const headers = {
    'content-type': 'text/html'
}

self.addEventListener('fetch', function (event) {
    // event.respondWith(
    //     new Response('Hello <strong>Lola!</strong>', {
    //         headers: {
    //             'Content-Type': 'text/html'
    //         }
    //     })
    // );

    // Checking for images
    // if (event.request.url.endsWith('.jpg')) {
    //     event.respondWith(
    //         fetch('img/10.jpg')
    //     );
    // }

    event.respondWith(
        fetch(event.request).then((response) => {
            if (response.status == 404) {
                return new Response("<h1>No resources were found.</h1>", { headers })
            }
            return response;
        }).catch((error) => {
            return new Response("<h1>Something went wrong!</h1>", { headers })
        })
    );
})