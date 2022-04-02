import { Kai } from "@kaimerra-corp/kai-api/dist/index";
import { Engine, Render, Runner, Bodies, Composite, Events } from "matter-js";

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
  const kai = await Kai.createForBrowser();

  // create an engine
  const engine = Engine.create();

  const balls = [];

  const update = everyN(10, () => {
    const ball = Bodies.circle(
      Math.random() * 400,
      50 - Math.random() * 2000,
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

  // create plinkers
  const plinkers = [];
  for (let i = 0; i < 100; ++i) {
    plinkers.push(
      Bodies.circle(Math.random() * 800, Math.random() * 400, 5, {
        isStatic: true,
        restitution: 0.5,
        render: {
          fillStyle: "white",
        },
      })
    );
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

  const boxB = Bodies.rectangle(400, 200, 80, 80, {
    restitution: 1.0,
  });
  const ground = Bodies.rectangle(400, 600, 810, 60, {
    isStatic: true,
    restitution: 1.0,
  });
  //const cieling = Bodies.rectangle(400, 10, 810, 60, { isStatic: true });

  // add all of the bodies to the world
  Composite.add(engine.world, [ground, boxB, ...plinkers]);

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  /*
  kai.on("any", (counters) => {
    const air = counters.get("air");
    const earth = counters.get("earth");
    engine.gravity.y = (earth - air) / air;
  });*/

  // run the engine
  Runner.run(runner, engine);
})();
