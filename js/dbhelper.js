/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Image Alts
   */
  static getImageAlt(imageName) {
    const imageAlts = {
      1: "Image of Mission Chinese Food Restaurant",
      2: "Image of Emily Restaurant",
      3: "Image of Manhattan Restaurant",
      4: "Image of Katz's Delicatessen Restaurant",
      5: "Image of Brooklyn Restaurant",
      6: "Image of Hometown BBQ Restaurant",
      7: "Image of Superiority Restaurant",
      8: "Image of The Dutch Restaurant",
      9: "Image of Mu Ramen Restaurant",
      10: "Image of Casa Enrique Restaurant"
    };
    return imageAlts[imageName];
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const dbStore = DBHelper.openDatabase();

    dbStore.then((db) => {
      fetch(`${DBHelper.DATABASE_URL}/restaurants`).then(response => {
        return response.json();
      }).then(response => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');

        response.map((restaurant, index) => {
          if (restaurant.photograph == null) {
            restaurant.imageAlt = DBHelper.getImageAlt(10);
          } else {
            restaurant.imageAlt = DBHelper.getImageAlt(restaurant.photograph);
          }
          store.put(restaurant);
        });

        callback(null, response);

      }).catch(e => {
        const error = (`Request failed.`);
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.index('by-id').getAll().then((restaurants) => {
          callback(null, restaurants);
        })
      })
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    const dbStore = DBHelper.openDatabase();
    const restaurantUrl = `${DBHelper.DATABASE_URL}/restaurants/${id}`;

    dbStore.then((db) => {
      fetch(restaurantUrl).then(response => {
        return response.json();
      }).then(restaurant => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');

        if (restaurant.photograph == null) {
          restaurant.imageAlt = DBHelper.getImageAlt(10);
        } else {
          restaurant.imageAlt = DBHelper.getImageAlt(restaurant.photograph);
        }

        store.put(restaurant);
        callback(null, restaurant);

      }).catch(e => {
        const error = (`Request failed.`);
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(id)).then((restaurant) => {
          callback(null, restaurant);
        })
      });
    })
  }

  static fetchRestaurantReviews(id, callback) {
    const dbStore = DBHelper.openDatabase();
    const reviewsUrl = `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
    dbStore.then((db) => {
      fetch(reviewsUrl).then(response => {
        if (response.status == 404)
          return null;

        return response.json();
      }).then(reviews => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(id)).then(restaurant => {
          restaurant.reviews = reviews;
          store.put(restaurant);
          callback(null, reviews);
        })
      })
    });
  }

  static favoriteARestaurant(restaurant, callback) {
    const dbStore = DBHelper.openDatabase();
    const favoriteUrl = `${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${!JSON.parse(restaurant.is_favorite)}`;

    dbStore.then((db) => {
      fetch(favoriteUrl, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        }
      }).then(response => {
        return response.json();
      }).then(modifiedRestaurant => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(restaurant.id)).then(idxRestaurant => {
          modifiedRestaurant.is_favorite = JSON.parse(modifiedRestaurant.is_favorite);
          idxRestaurant.is_favorite = modifiedRestaurant.is_favorite;
          store.put(idxRestaurant);
          callback(null, modifiedRestaurant);
        })
      }).catch(e => {
        // TODO: offline caching
        console.error('favoriteARestaurant', e);
        callback(e, null);
      })
    });
  }

  static addReview(reviewData, callback) {
    const dbStore = DBHelper.openDatabase();
    const reviewUrl = `${DBHelper.DATABASE_URL}/reviews`;

    dbStore.then((db) => {
      fetch(reviewUrl, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(reviewData)
      }).then(response => {
        return response.json();
      }).then((newReview) => {
        // TODO: caching implementation goes here
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(reviewData.restaurant_id)).then(restaurant => {
          restaurant.reviews.push(newReview);
          store.put(restaurant);
          callback(null, restaurant.reviews);
        })
      }).catch((e) => {
        console.error('addReview', e);
        callback(e, null)
      })
    });
  }

  static editReview(reviewData, callback) {
    const dbStore = DBHelper.openDatabase();
    const reviewUrl = `${DBHelper.DATABASE_URL}/reviews/${reviewData.id}`;

    dbStore.then((db) => {
      fetch(reviewUrl, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(reviewData)
      }).then(response => {
        return response.json();
      }).then(modifiedReview => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(reviewData.restaurant_id)).then(restaurant => {
          const restaurantReview = restaurant.reviews.filter((r) => r.id == modifiedReview.id)[0];
          restaurantReview.name = modifiedReview.name;
          restaurantReview.rating = modifiedReview.rating;
          restaurantReview.comments = modifiedReview.comments;
          store.put(restaurant);
          callback(null, modifiedReview);
        })
      }).catch(e => {
        // TODO: offline updating goes here
        callback(e, null);
      })
    });
  }

  static deleteRestaurantReview(reviewId, restaurantId, callback) {
    const dbStore = DBHelper.openDatabase();
    const reviewsUrl = `${DBHelper.DATABASE_URL}/reviews/${reviewId}`;

    dbStore.then((db) => {
      fetch(reviewsUrl, {
        method: 'DELETE'
      }).then(response => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(restaurantId)).then(restaurant => {
          restaurant.reviews = restaurant.reviews.filter((review, index) => {
            return review.id != reviewId;
          });
          store.put(restaurant);
        });
        callback(null, response);
      }).catch((e) => callback(e, null));
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {

    if (restaurant.photograph == undefined) {
      return (`/img/10.jpg`);
    }

    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  static openDatabase() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }

    return idb.open('restaurantsDb', 1, (upgradeDb) => {
      var store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
      store.createIndex('by-id', 'id');
    })
  }

}