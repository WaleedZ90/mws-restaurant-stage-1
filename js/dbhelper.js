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

  static get MAP_BASE_URL() {
    return 'https://maps.googleapis.com/maps/api/staticmap?center="40.722216,-73.987501"&zoom=12&size=640x400&maptype=roadmap&key=AIzaSyDTD3VLNZHxfKu88cnua2O2VFYHLoV7V1U&scale=2';
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


        response.map((restaurant, index) => {
          if (restaurant.photograph == null) {
            restaurant.imageAlt = DBHelper.getImageAlt(10);
          } else {
            restaurant.imageAlt = DBHelper.getImageAlt(restaurant.photograph);
          }

          db.transaction('restaurants', 'readwrite').objectStore('restaurants').get(restaurant.id).then(idbRestaurant => {
            if (idbRestaurant && idbRestaurant.reviews)
              restaurant.reviews = idbRestaurant.reviews;

            const tx = db.transaction('restaurants', 'readwrite');
            const store = tx.objectStore('restaurants');
            store.put(restaurant);
          })
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
      }).catch(e => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(id)).then(restaurant => {
          callback(null, restaurant.reviews);
        })
      })
    });
  }

  static favoriteARestaurant(restaurant, callback) {
    // Sometimes restaurants coming from the api don't have is_favorite flag, so we run this check in order not to cause any exceptions
    if (restaurant.is_favorite == null)
      restaurant.is_favorite = false;

    const dbStore = DBHelper.openDatabase();
    const newFavorite = !JSON.parse(restaurant.is_favorite);
    const favoriteUrl = `${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${newFavorite}`;

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
        });
      }).catch(e => {
        console.error('favoriteARestaurant', e);
        const favoriteStoreTx = db.transaction('favorites', 'readwrite').objectStore('favorites');
        const updatedFavorite = restaurant;
        updatedFavorite.is_favorite = newFavorite;
        favoriteStoreTx.put(updatedFavorite);

        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(restaurant.id)).then(idxRestaurant => {
          idxRestaurant.is_favorite = newFavorite;
          store.put(idxRestaurant);
          callback(null, idxRestaurant);
        });
      })
    });
  }

  static cleanFavoriteStore() {
    const dbStore = DBHelper.openDatabase();
    dbStore.then((db) => {
      db.transaction('favorites', 'readwrite').objectStore('favorites').getAll().then((favorites) => {
        favorites.forEach(favorite => {
          const favoriteUrl = `${DBHelper.DATABASE_URL}/restaurants/${favorite.id}/?is_favorite=${favorite.is_favorite}`;
          fetch(favoriteUrl, {
            method: 'PUT',
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            }
          }).then(response => {
            return response.json();
          }).then(modifiedRestaurant => {
            const store = db.transaction('favorites', 'readwrite').objectStore('favorites');
            store.delete(modifiedRestaurant.id);
            return store.complete;
          })
        });
      });
    }).catch(e => console.error('cleanFavoriteStore', e));
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

        const addedReviewsStore = db.transaction('addedReviews', 'readwrite').objectStore('addedReviews');
        addedReviewsStore.add(reviewData);

        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(reviewData.restaurant_id)).then(restaurant => {
          restaurant.reviews.push(reviewData);
          store.put(restaurant);
          callback(null, restaurant.reviews);
        })
      })
    });
  }

  static cleanupAddReviews() {
    const dbStore = DBHelper.openDatabase();
    dbStore.then((db) => {
      db.transaction('addedReviews', 'readwrite').objectStore('addedReviews').getAll().then(reviews => {
        const reviewUrl = `${DBHelper.DATABASE_URL}/reviews`;
        fetch(reviewUrl, {
            method: 'POST',
            headers: {
              "Content-Type": "application/json; charset=utf-8",
            },
            body: JSON.stringify(reviews)
          }).then(response => response.json())
          .then(addedReviews => {
            reviews.forEach(addedReview => {
              const store = db.transaction('addedReviews', 'readwrite').objectStore('addedReviews');
              store.delete(addedReview.id);
              return store.complete;
            })
          })

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
        const modifiedReviewStore = db.transaction('modifiedReviews', 'readwrite').objectStore('modifiedReviews');
        modifiedReviewStore.put(reviewData);

        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(reviewData.restaurant_id)).then(restaurant => {
          const restaurantReview = restaurant.reviews.filter((r) => r.id == reviewData.id)[0];
          restaurantReview.name = reviewData.name;
          restaurantReview.rating = reviewData.rating;
          restaurantReview.comments = reviewData.comments;
          store.put(restaurant);
          callback(null, restaurantReview);
        })
      })
    });
  }

  static cleanupEditedReviews() {
    const dbStore = DBHelper.openDatabase();
    dbStore.then((db) => {
      db.transaction('modifiedReviews', 'readwrite').objectStore('modifiedReviews').getAll().then(reviews => {
        reviews.forEach(review => {
          const reviewUrl = `${DBHelper.DATABASE_URL}/reviews/${review.id}`;
          fetch(reviewUrl, {
              method: 'PUT',
              headers: {
                "Content-Type": "application/json; charset=utf-8",
              },
              body: JSON.stringify(review)
            }).then(response => response.json())
            .then(modifiedReview => {
              const store = db.transaction('modifiedReviews', 'readwrite').objectStore('modifiedReviews');
              store.delete(modifiedReview.id);
              return store.complete;
            })
        });
      }).catch(e => console.error('cleanupEditedReviews', e));
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
          callback(null, response);
        });
      }).catch((e) => {
        const deletedReviewsStore = db.transaction('deletedReviews', 'readwrite').objectStore('deletedReviews');
        deletedReviewsStore.put({
          id: reviewId
        });

        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');
        store.get(Number(restaurantId)).then(restaurant => {
          restaurant.reviews = restaurant.reviews.filter((review, index) => {
            return review.id != reviewId;
          });
          store.put(restaurant);
          callback(null, restaurant);
        });
      });
    });
  }

  static cleanupDeletedReviews() {
    const dbStore = DBHelper.openDatabase();
    dbStore.then((db) => {
      db.transaction('deletedReviews', 'readwrite').objectStore('deletedReviews').getAll().then(reviewsIds => {
        reviewsIds.forEach(reviewId => {
          const reviewsUrl = `${DBHelper.DATABASE_URL}/reviews/${reviewId.id}`;
          fetch(reviewsUrl, {
            method: 'DELETE'
          }).then(response => {
            if (response.status != 404) {
              const store = db.transaction('deletedReviews', 'readwrite').objectStore('deletedReviews');
              store.delete(reviewId.id);
              return store.complete;
            }
          })
        })
      })
    }).catch(e => console.error('cleanupDeletedReviews', e));
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
      return (`/img/10.webp`);
    }

    return (`/img/${restaurant.photograph}.webp`);
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
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        var store = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
        store.createIndex('by-id', 'id');
      }

      if (!upgradeDb.objectStoreNames.contains('favorites')) {
        // save offline favorited restaurants to update them when server is online.
        var offlineFavoriteStore = upgradeDb.createObjectStore('favorites', {
          keyPath: 'id'
        });
        offlineFavoriteStore.createIndex('by-id', 'id');
      }

      if (!upgradeDb.objectStoreNames.contains('deletedReviews')) {
        // store to save the reviews to be deleted when the server is online.
        var offlineDeletedReviews = upgradeDb.createObjectStore('deletedReviews', {
          keyPath: 'id'
        });
        offlineDeletedReviews.createIndex('by-id', 'id');
      }

      if (!upgradeDb.objectStoreNames.contains('modifiedReviews')) {
        var offlineModifiedReviews = upgradeDb.createObjectStore('modifiedReviews', {
          keyPath: 'id'
        });
        offlineModifiedReviews.createIndex('by-id', 'id');
      }

      if (!upgradeDb.objectStoreNames.contains('addedReviews')) {
        var offlineAddedReviews = upgradeDb.createObjectStore('addedReviews', {
          keyPath: 'id',
          autoIncrement: true
        });
        offlineAddedReviews.createIndex('by-id', 'id');
      }
    });
  }
}