let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initRestaurantMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

document.addEventListener('DOMContentLoaded', (event) => {
  DBHelper.cleanupDeletedReviews();
  DBHelper.cleanupAddReviews();
  DBHelper.cleanupEditedReviews();
});

/**
 * Post: Add a new review
 */
function submitReview(e) {
  e.preventDefault();

  // capture form data
  const formData = e.target;
  const name = formData['name'].value;
  const rating = formData['rating'].value;
  const comments = formData['comments'].value;
  const restaurant_id = getParameterByName('id');

  // apply some validations
  const dataIsValid = ((name && name != '') && (rating && rating != '' && !isNaN(rating)) && (comments && comments != ''));

  if (dataIsValid) {
    const reviewData = {
      name,
      rating,
      comments,
      restaurant_id
    };

    DBHelper.addReview(reviewData, (error, reviews) => {
      if (reviews) {
        self.restaurant.reviews = reviews;
        fillReviewsHTML();
      }
    });
  } else {
    alert('Invalid form data, please correct the data and try again.');
  }
}

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

fetchRestaurantFromURL((error, restaurant) => {
  if (error) { // Got an error!
    console.error(error);
  } else {
    fillBreadcrumb();
    buildMapUrl();
  }
});

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.alt = restaurant.imageAlt;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  DBHelper.fetchRestaurantReviews(restaurant.id, (error, reviews) => {
    self.restaurant.reviews = reviews;
    fillReviewsHTML();
  })
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  container.querySelectorAll('.review-item').forEach(el => el.remove());

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.className = 'review-item';
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  const deleteReviewButton = document.createElement('button');
  deleteReviewButton.innerHTML = `
    <svg width="13" height="13" aria-hidden="true" data-prefix="fas" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
      <path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
    </svg>
  `;
  deleteReviewButton.addEventListener('click', (e) => {
    DBHelper.deleteRestaurantReview(review.id, review.restaurant_id, (error, success) => {
      if (success)
        li.remove();
    })
  })

  deleteReviewButton.className = 'delete-review-button';
  deleteReviewButton.setAttribute('aria-label', 'delete review button');

  li.appendChild(deleteReviewButton);

  const editReviewButton = document.createElement('button');
  editReviewButton.innerHTML = '<svg width="13" height="13" aria-hidden="true" data-prefix="fas" data-icon="edit" class="svg-inline--fa fa-edit fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>';
  editReviewButton.addEventListener('click', (e) => {
    const elementChildren = e.currentTarget.parentElement.childNodes;
    const nameField = elementChildren[0];
    const ratingField = elementChildren[1]
    const commentsField = elementChildren[2];

    // Entering Edit mode
    if (e.currentTarget.innerText != 'Cancel') {
      e.currentTarget.innerText = 'Cancel';
      const oldValues = {
        name: nameField.innerText.toString(),
        rating: ratingField.innerText.toString(),
        comments: commentsField.innerText.toString()
      };

      nameField.setAttribute('style', 'display:none;');
      ratingField.setAttribute('style', 'display:none;');
      commentsField.setAttribute('style', 'display:none;');

      const parentContainer = e.currentTarget.parentElement;
      const nameTextBox = document.createElement('input');
      nameTextBox.id = 'nameTextBox';
      nameTextBox.className = 'form-control';
      nameTextBox.setAttribute("type", "text");
      nameTextBox.value = oldValues.name;
      parentContainer.appendChild(nameTextBox);


      const ratingTextBox = document.createElement('input');
      ratingTextBox.id = 'ratingTextBox';
      ratingTextBox.className = 'form-control';
      ratingTextBox.setAttribute('type', 'number');
      ratingTextBox.setAttribute('min', '1');
      ratingTextBox.setAttribute('max', '10');
      ratingTextBox.value = oldValues.rating.replace('Rating: ', '');
      parentContainer.appendChild(ratingTextBox);

      const commentsTextBox = document.createElement('textarea');
      commentsTextBox.id = 'commentsTextBox';
      commentsTextBox.className = 'form-control';
      commentsTextBox.innerText = oldValues.comments;
      parentContainer.appendChild(commentsTextBox);

      const editButton = document.createElement('button');
      editButton.className = 'form-control';
      editButton.innerText = 'Edit';
      editButton.addEventListener('click', (ev) => {
        const name = document.getElementById('nameTextBox').value;
        const rating = document.getElementById('ratingTextBox').value;
        const comments = document.getElementById('commentsTextBox').value;

        const newReview = {
          name,
          rating,
          comments,
          restaurant_id: review.restaurant_id,
          id: review.id
        };

        DBHelper.editReview(newReview, (error, success) => {
          if (success) {
            const formControls = document.querySelectorAll('.form-control');

            const readOnlyControls = formControls[0].parentElement.childNodes;
            readOnlyControls[0].innerText = success.name;
            readOnlyControls[0].setAttribute('style', 'display:block;');

            readOnlyControls[1].innerText = success.rating;
            readOnlyControls[1].setAttribute('style', 'display:block;');

            readOnlyControls[2].innerText = success.comments;
            readOnlyControls[2].setAttribute('style', 'display:block;');

            formControls.forEach(control => control.remove());

            const editButton = readOnlyControls[4];
            editButton.innerHTML = '<svg width="13" height="13" aria-hidden="true" data-prefix="fas" data-icon="edit" class="svg-inline--fa fa-edit fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>';
          }
        });
      });

      parentContainer.appendChild(editButton);
    } else {
      // Already in Edit mode.
      const formControls = e.currentTarget.parentElement.querySelectorAll('.form-control');
      formControls.forEach(control => control.remove());
      nameField.setAttribute('style', 'display:block;');
      ratingField.setAttribute('style', 'display:block;');
      commentsField.setAttribute('style', 'display:block;');
      e.currentTarget.innerHTML = '<svg width="13" height="13" aria-hidden="true" data-prefix="fas" data-icon="edit" class="svg-inline--fa fa-edit fa-w-18" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="currentColor" d="M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z"></path></svg>';
    }
  });

  editReviewButton.className = 'edit-review-button';
  editReviewButton.setAttribute('aria-label', 'edit review button');

  li.appendChild(editReviewButton);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * create google static map url
 */

let buildMapUrl = (restaurant = self.restaurant) => {
  const restaurantFirstLetter = restaurant.name.charAt(0).toUpperCase();
  let marker = `&markers=color:red%7Clabel:${restaurantFirstLetter}%7C${restaurant.latlng.lat},${restaurant.latlng.lng}`;
  let url = `https://maps.googleapis.com/maps/api/staticmap?center="${restaurant.latlng.lat},${restaurant.latlng.lng}"&zoom=16&size=640x400&maptype=roadmap&key=AIzaSyDTD3VLNZHxfKu88cnua2O2VFYHLoV7V1U&scale=2`;

  const imgMap = document.getElementById('map');
  imgMap.src = `${url}${marker}`;
}