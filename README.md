# functional_frogger

This is an attempt to implement Frogger arcade game using functional programming in Typescript with MVC architecture.

## How to run the code

There are two ways to run the code:

1. Build the code and then open the web page

- Run `npm install`
- Run `npm run build`
- Open the html file dist/index.html (NOT src/index.html)

2. Use the development server

- Run `npm install`
- Run `npm run dev`, this will automatically open a web page at localhost:4000
- Open localhost:4000 in your browser if it didn't already

## How to play
* Use AWSD keys to move the frog
* The goal of the game is to move the frog from the bottom of the screen to the top and score as many points as possible
* In the ground section, Frog may move/stand on the ground, but dies when
colliding with a car object
* In the river section, Frog may move/stand on plank objects, but dies when
landing in the water (ground)
* Frog dies when colliding with any enemies (e.g. snakes, crocodiles)
## Screenshots
* ![Gameplay](/img/screenshot1.png)
* ![Gameplay](/img/screenshot2.png)
## Todo list
* Add more enemies
* Add Win screen
* Implement frog resting spots 
