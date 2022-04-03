import { Kai } from "@kaimerra-corp/kai-api/dist/index";
import {
  Mouse,
  MouseConstraint,
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Events,
} from "matter-js";

import "../assets/css.css";
import * as aether from "../assets/floweraethersingle.png";

const everyN = (n, f) => {
  let count = 0;
  return () => {
    if (count === n) {
      f();
      count = 0;
    }

    count += 1;
  };
};

(async () => {
  let kai;
  try { 
    kai = await Kai.createForBrowser();
  } catch (error) {
    console.log("Could not connect to kaipod!");
  }

  // create an engine
  const engine = Engine.create();

  const balls = [];

  const update = everyN(4, () => {
    const ball = Bodies.circle(
      Math.random() * 800,
      200 - Math.random() * 1000,
      12,
      {
        render: {
          sprite: {
            texture: aether,
            xScale: 2.0,
            yScale: 2.0,
          },
        },
        restitution: 1.0,
      }
    );
    Composite.add(engine.world, [ball]);
    balls.push(ball);

    if (balls.length > 1000) {
      const ball = balls.shift();
      Composite.remove(engine.world, ball);
    }
  });

  Events.on(engine, "afterUpdate", update);

  // create a renderer
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      background: "transparent",
    },
  });

  const mouse = Mouse.create(render.canvas);

  const mouseConstraint = MouseConstraint.create(engine, { mouse });

  /*
  Events.on(mouseConstraint, "mousedown", function (event) {
    console.log(event);
    engine.gravity.x = (event.mouse.absolute.x - 400) / 200.0;
    engine.gravity.y = (event.mouse.absolute.y - 400) / 200.0;
  });*/

  // create plinkers
  const plinkers = [];

  let flip = false;
  for (let y = 0; y < 600; y += 60) {
    for (let x = 0; x < 800; x += 60) {
      plinkers.push(
        Bodies.circle(x + (flip ? 30 : 0), y, 5, {
          isStatic: true,
          restitution: 0.5,
          render: {
            fillStyle: "white",
          },
        })
      );
    }
    flip = !flip;
  }

  // create two boxes and a ground
  /*
  const balls = [];
  for (let i = 0; i < 1000; ++i) {
    balls.push(
      Bodies.circle(Math.random() * 400, 50 - Math.random() * 2000, 12, {
        render: {
          sprite: {
            texture: aether,
            xScale: 2.0,
            yScale: 2.0,
          },
        },
        restitution: 1.0,
      })
    );
  }*/

  const ground = Bodies.rectangle(400, 600, 810, 60, {
    isStatic: true,
    restitution: 1.0,
  });
  //const cieling = Bodies.rectangle(400, 10, 810, 60, { isStatic: true });

  // add all of the bodies to the world
  Composite.add(engine.world, [ground, ...plinkers]);

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  //engine.gravity.y = -1;
  kai && kai.on("any", (counters) => {
    const air = counters.get("air");
    const earth = counters.get("earth");
    engine.gravity.y = (earth - air) / air;
  });

  // run the engine
  Runner.run(runner, engine);
})();
