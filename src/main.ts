import "./style.css";
import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan, } from "rxjs/operators";
function main() {
  /**
   * Inside this function you will use the classes and functions from rx.js
   * to add visuals to the svg element in pong.html, animate them, and make them interactive.
   *
   * Study and complete the tasks in observable examples first to get ideas.
   *
   * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
   *
   * You will be marked on your functional programming style
   * as well as the functionality that you implement.
   *
   * Document your code!
   */
  /**
   * Code that are taken from Tim's code from the Asteroid example (some of them are modified)):
   * keyObservable
   * createfrog
   * createObjects
   * torusWrap
   * reduceState
   * handleCollisions
   * updateView
   * not
   * elem
   * attr
   */
  // Keys that players can press
  type Key = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "KeyR";
  // Events of the keys
  type Event = "keydown" | "keyup";

  // Game constant variables
  const Constants = {
    CANVAS_SIZE: 600,
    START_TIME: 0,
    MOVING_DIST: 50,
    OBJECT_PER_ROW: 3,
    FILLABLE_SLOT: 5,
  } as const;

  // Object can be displayed in the game
  type ViewType = "frog" | "car" | "plank" | "water" | "turtle" | "fillable";

  // Create tick of the gameClock
  class Tick {
    constructor(public readonly elapsed: number) {}
  }
  // Create a movement instance contains the cordinates of the object
  class Move {
    constructor(
      public readonly directionX: number = 0,
      public readonly directionY: number = 0
    ) {}
  }
  // Create a instance that restart the game
  class Restart {
    constructor() {}
  }
  // The game clock is an obserbable that emits a Tick every 10ms
  const gameClock = interval(10).pipe(map((elapsed) => new Tick(elapsed))),
    /**
     * Create a observable that emits an action when the user presses the arrow keys.
     * @param e is the event when the user presses or releases the arrow key
     * @param k the key to be pressed
     * @param result apply a function to the observable
     */
    keyObservable = <T>(e: Event, k: Key, result: () => T) =>
      fromEvent<KeyboardEvent>(document, e).pipe(
        filter(({ code }) => code === k),
        filter(({ repeat }) => !repeat),
        map(result)
      ),
    moveUp = keyObservable(
      "keydown",
      "ArrowUp",
      () => new Move(0, -Constants.MOVING_DIST)
    ),
    moveDown = keyObservable(
      "keydown",
      "ArrowDown",
      () => new Move(0, Constants.MOVING_DIST)
    ),
    moveLeft = keyObservable(
      "keydown",
      "ArrowLeft",
      () => new Move(-Constants.MOVING_DIST, 0)
    ),
    moveRight = keyObservable(
      "keydown",
      "ArrowRight",
      () => new Move(Constants.MOVING_DIST, 0)
    ),
    restart = keyObservable("keydown", "KeyR", () => new Restart());

  type ObjectsShape = Readonly<{
    pos: Vec;
    color: string;
    height: number;
    width: number;
    isCollided: boolean;
  }>;
  type ObjectId = Readonly<{ id: string; createTime: number }>;
  interface IBody extends ObjectsShape, ObjectId {
    viewType: ViewType;
    vel: Vec;
  }
  // Full state of the game
  type State = Readonly<{
    time: number;
    frog: Body;
    car: Body[];
    water: Body;
    plank: Body[];
    turtle: Body[];
    fillable: Body[];
    score: number;
    highscore: number;
    FrogMaxY: number;
    gameOver: boolean;
  }>;
  // Every object that participates in physics is a Body
  type Body = Readonly<IBody>;
  /**
   * This function create a body of the frog which contains all its properties
   */
  function createfrog(): Body {
    return {
      id: "frog",
      viewType: "frog",
      pos: new Vec(300, Constants.CANVAS_SIZE - 50),
      color: "green",
      vel: new Vec(0, 0),
      height: 50,
      width: 50,
      createTime: 0,
      isCollided: false,
    };
  }
  /**
   * This is a curried function that create a body of objects which contains all its properties
   * @param viewType is the viewtype of the objects
   * @param oid the object's id
   * @param shape is the properties of the objects
   * @param vel is the velocity of the objects whether it can move or not
   * @returns a body of objects
   */
  const createObjects =
    (viewType: ViewType) =>
    (oid: ObjectId) =>
    (shape: ObjectsShape) =>
    (vel: Vec) =>
      <Body>{
        ...oid,
        ...shape,
        vel: vel,
        id: viewType + oid.id,
        viewType: viewType,
      };
  const createCars = createObjects("car"),
    createWater = createObjects("water"),
    createPlanks = createObjects("plank"),
    createTurtle = createObjects("turtle"),
    createFillable = createObjects("fillable");

  // Create cars objects in multiple locations
  const startCar = [...Array(Constants.OBJECT_PER_ROW)]
      .map((_, i) =>
        createCars({ id: String(i), createTime: Constants.START_TIME })({
          color: "#f54a4a",
          pos: new Vec(200 * (i + 1), 500),
          height: 50,
          width: 70,
          isCollided: false,
        })(new Vec(-0.7, 0))
      )
      .concat(
        [...Array(Constants.OBJECT_PER_ROW)].map((_, i) =>
          createCars({
            id: String(i + Constants.OBJECT_PER_ROW),
            createTime: Constants.START_TIME,
          })({
            color: "#f54a4a",
            pos: new Vec(200 * (i + 1), 450),
            height: 50,
            width: 70,
            isCollided: false,
          })(new Vec(1, 0))
        ),
        [...Array(Constants.OBJECT_PER_ROW)].map((_, i) =>
          createCars({
            id: String(i + Constants.OBJECT_PER_ROW * 2),
            createTime: Constants.START_TIME,
          })({
            color: "#f54a4a",
            pos: new Vec(200 * (i + 1), 400),
            height: 50,
            width: 70,
            isCollided: false,
          })(new Vec(-2, 0))
        )
      ),
    // Create water objects
    startWater = createWater({
      id: "water",
      createTime: Constants.START_TIME,
    })({
      color: "#4a9df5",
      pos: new Vec(0, 200),
      height: 150,
      width: 600,
      isCollided: false,
    })(new Vec(0, 0)),
    // Create plank objects
    startPlank = [...Array(Constants.OBJECT_PER_ROW)].map((_, i) =>
      createPlanks({ id: String(i), createTime: Constants.START_TIME })({
        color: "#6d4c40",
        pos: new Vec(200 * (i + 1), 300),
        height: 50,
        width: 100,
        isCollided: false,
      })(new Vec(-2, 0))
    ),
    // Create turtle objects in multiple locations
    startTurle = [...Array(Constants.OBJECT_PER_ROW)]
      .map((_, i) =>
        createTurtle({ id: String(i), createTime: Constants.START_TIME })({
          color: "green",
          pos: new Vec(200 * (i + 1), 250),
          height: 50,
          width: 50,
          isCollided: false,
        })(new Vec(2, 0))
      )
      .concat(
        [...Array(Constants.OBJECT_PER_ROW)].map((_, i) =>
          createTurtle({
            id: String(i + Constants.OBJECT_PER_ROW),
            createTime: Constants.START_TIME,
          })({
            color: "green",
            pos: new Vec(200 * (i + 1), 200),
            height: 50,
            width: 50,
            isCollided: false,
          })(new Vec(-2, 0))
        )
      ),
    // Create fillable objects
    startFillable = [...Array(Constants.FILLABLE_SLOT)].map((_, i) =>
      createFillable({ id: String(i), createTime: Constants.START_TIME })({
        color: "white",
        pos: new Vec(100 * (i + 1), 100),
        height: 50,
        width: 50,
        isCollided: false,
      })(new Vec(0, 0))
    );
  // Initial state of the game
  const initialState: State = {
      time: Constants.START_TIME,
      frog: createfrog(),
      car: startCar,
      water: startWater,
      plank: startPlank,
      turtle: startTurle,
      fillable: startFillable,
      score: 0,
      highscore: 0,
      FrogMaxY: 550,
      gameOver: false,
    },
    /**
     * This function handle the collision between the frog and the objects
     * @param s is the state of the game
     * @returns the state of the game after checking the collision
     */
    handleCollisions = (s: State) => {
      /**
       * This function checks if two objects are collided or not
       * @param a is the the body object
       * @param b is the other body object
       * @returns boolean value whether the two objects are collided or not
       */
      const bodiesCollided = ([a, b]: [Body, Body]) =>
          a.pos.x < b.pos.x + b.width &&
          a.pos.x + a.width > b.pos.x &&
          a.pos.y < b.pos.y + b.height &&
          a.height + a.pos.y > b.pos.y,
        // Check if the frog is collided with the cars
        frogCollided =
          s.car.filter((r) => bodiesCollided([s.frog, r])).length > 0,
        // Check if the frog is in the water
        frogOnWater =
          bodiesCollided([s.frog, s.water]) &&
          !(
            s.plank.filter((r) => bodiesCollided([s.frog, r])).length > 0 ||
            s.turtle.filter((r) => bodiesCollided([s.frog, r])).length > 0
          ),
          finishLine = s.frog.pos.y < 50;

      return <State>{
        ...s,
        gameOver: frogCollided || frogOnWater || finishLine,
      };
    },
    /**
     * This function keeps the object inside the canvas
     * @param x is the X cordinates of the object
     * @param y is the Y cordinates of the object
     * @return the new cordinate that keeps the object inside the canvas
     */
    // wrap a positions around edges of the screen
    torusWrapFrog = ({ x, y }: Vec) => {
      const s = Constants.CANVAS_SIZE - 50,
        wrap = (v: number) => (v < 0 ? 0 : v > s ? s : v); // Keep the frog inside the canvas
      return new Vec(wrap(x), wrap(y));
    },
    /**
     * This function keeps the object wrap around the canvas
     * @param x is the X cordinates of the object
     * @param y is the Y cordinates of the object
     * @return the new cordinate that wraps the object around the canvas
     */
    torusWrap = ({ x, y }: Vec) => {
      const s = Constants.CANVAS_SIZE,
        wrap = (v: number) => (v < -50 ? v + s : v > s ? v - s : v); // Make the object wrap around the canvas
      return new Vec(wrap(x), wrap(y));
    },
    // all movement comes through here
    /**
     * This function moves NPC object (e.g. cars, planks, turtles, etc)
     * @param b is the body of the object
     * @return the new position of the object
     */
    moveBody = (o: Body) =>
      <Body>{
        ...o,
        pos: torusWrap(o.pos.add(o.vel)),
      },
    /**
     * This function is used to update the game state along with the game clock
     * @param s is the state of the game
     * @param e is the unit of time in the game clock
     * @return the new state of the game of the next units of time in the game
     */
    tick = (s: State, elapsed: number) => {
      return handleCollisions({
        ...s,
        frog: s.gameOver? createfrog() : s.frog,
        score: s.gameOver? 0 : s.frog.pos.y < s.FrogMaxY ? s.score + 1 : s.score ,
        highscore: s.score > s.highscore ? s.score : s.highscore,
        FrogMaxY: s.frog.pos.y < s.FrogMaxY ? s.frog.pos.y : s.FrogMaxY,
        car: s.car.map(moveBody),
        plank: s.plank.map(moveBody),
        turtle: s.turtle.map(moveBody),
        time: elapsed,
      });
    },
    /**
     * This function is used in the scan function in the observable to update the game state
     * @param s is the state of the game
     * @param e is the actions that the user can do in the game/ the game tick
     * @return the new game state after an action.
     */
    reduceState = (s: State, e: Move | Restart | Tick) =>
      e instanceof Move
        ? {
            ...s,
            frog: {
              ...s.frog,
              pos: torusWrapFrog(
                new Vec(e.directionX, e.directionY).add(s.frog.pos)
              ),
            },
          }
        : e instanceof Restart
        ? {
            ...s,
            time: Constants.START_TIME,
            frog: createfrog(),
            car: startCar,
            water: startWater,
            plank: startPlank,
            turtle: startTurle,
            fillable: startFillable,
            score: 0,
            FrogMaxY: 550,
            gameOver: false,
          }
        : tick(s, e.elapsed);

  // main game stream
  const subscription = merge(
    gameClock,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    restart
  )
    .pipe(scan(reduceState, initialState))
    .subscribe(updateView);

  /**
   * This function update all the view of the game
   * @param s state of the game
   */
  //This function is the only function that is impure but it is contained inside the subscribe function
  function updateView(s: State) {
    const svg = document.getElementById("underLayer")!,
      frog = document.getElementById("frog")!;
    const updateBodyView = (b: Body) => {
        function createBodyView() {
          const viewType = document.getElementById(b.viewType)!;
          const v = document.createElementNS(viewType.namespaceURI, "rect")!;
          attr(v, {
            id: b.id,
            width: b.width,
            height: b.height,
            fill: b.color,
            stroke: "black",
            "stroke-width": "1",
            "stroke-location": "inside",
          });
          v.classList.add(b.viewType);
          viewType.appendChild(v);
          return v;
        }
        const v = document.getElementById(b.id) || createBodyView();
        attr(v, { x: b.pos.x, y: b.pos.y });
      },
      show = (id: string, condition: boolean) =>
        ((e: HTMLElement) =>
          condition ? e.classList.add("hidden")! : e.classList.remove("hidden")!)(
          document.getElementById(id)!
        );
        show("turtle", s.time % 100 > 50);
    // update the frog position
    attr(frog, {
      transform: `translate(${s.frog.pos.x},${s.frog.pos.y})`,
      width: s.frog.width,
      height: s.frog.height,
    });
    // update the frog position
    s.car.forEach(updateBodyView);
    // Draw water
    updateBodyView(s.water);
    // Draw planks
    s.plank.forEach(updateBodyView);
    // Draw turtles
    s.turtle.forEach(updateBodyView);
    // Draw fillable
    s.fillable.forEach(updateBodyView);
    // update score
    const score = document.getElementById("score")!;
    score.innerHTML = `Score: ${s.score}`;
    // update highscore
    const highscore = document.getElementById("highscore")!;
    highscore.innerHTML = `Highscore: ${s.highscore}`;
    // Unsuscribe if game is over
    if (s.gameOver) {
      const v = document.getElementById("gameover")!;
      v.textContent = "Game Over";
      setTimeout(() => v.textContent = "", 300);
    }
  }
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
class Vec {
  constructor(public readonly x: number = 0, public readonly y: number = 0) {}
  add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y);
  sub = (b: Vec) => this.add(b.scale(-1));
  len = () => Math.sqrt(this.x * this.x + this.y * this.y);
  scale = (s: number) => new Vec(this.x * s, this.y * s);
  ortho = () => new Vec(this.y, -this.x);
  static Zero = new Vec();
}
const /**
   * Composable not: invert boolean result of given function
   * @param f a function returning boolean
   * @param x the value that will be tested with f
   */
  not =
    <T>(f: (x: T) => boolean) =>
    (x: T) =>
      !f(x),
  /**
   * is e an element of a using the eq function to test equality?
   * @param eq equality test function for two Ts
   * @param a an array that will be searched
   * @param e an element to search a for
   */
  elem =
    <T>(eq: (_: T) => (_: T) => boolean) =>
    (a: ReadonlyArray<T>) =>
    (e: T) =>
      a.findIndex(eq(e)) >= 0,
  /**
   * array a except anything in b
   * @param eq equality test function for two Ts
   * @param a array to be filtered
   * @param b array of elements to be filtered out of a
   */
  /**
   * set a number of attributes on an Element at once
   * @param e the Element
   * @param o a property bag
   */
  attr = (e: Element, o: { [key: string]: Object }) => {
    for (const k in o) e.setAttribute(k, String(o[k]));
  };
