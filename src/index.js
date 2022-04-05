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

const counters = ["fire", "water", "air", "earth", "aether"];
const step = (2 * Math.PI) / 5;

const counterPoints = {};

let angle = 0;
for (const k of counters) {
  counterPoints[k] = [Math.sin(angle) * 280 + 300, Math.cos(angle) * 280 + 300];
  angle += step;
}

const computeGravity = (counters) => {
  let x_sum = 0;
  let y_sum = 0;

  let sum = 0;

  for (let [c, n] of counters.entries()) {
    n = Math.abs(n);
    x_sum += (counterPoints[c][0] - 300) * n;
    y_sum += (counterPoints[c][1] - 300) * n;

    sum += n;
  }

  x_sum /= sum;
  y_sum /= sum;

  return [(x_sum / 280.0) * 2.0, (y_sum / 280.0) * 2.0];
};

(async () => {
  let kai;

  const canvas = document.getElementById("canvas");

  // create an engine
  const engine = Engine.create();

  const balls = [];

  const update = everyN(8, () => {
    // Add a ball.
    const ball = Bodies.circle(
      300 + Math.random() * 100,
      300 + Math.random() * 100,
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
    canvas: canvas,
    engine: engine,
    options: {
      wireframes: false,
      visible: false,
      width: 600,
      height: 600,
      background: "transparent",
    },
  });

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

  // Create the boundaries
  /*
  const boundaries = [];
  const pointsArray = Object.values(counterPoints);
  for (let i = 0; i < pointsArray.length; i++) {
    console.log("hello");
    const j = (i + 1) % pointsArray.length;

    const i_x = pointsArray[i][0] - 300;
    const i_y = pointsArray[i][1] - 300;
    const j_x = pointsArray[j][0] - 300;
    const j_y = pointsArray[j][1] - 300;

    const verts = Vertices.fromPath(`
       M ${i_x} ${i_y}
       L ${i_x * 10} ${i_y * 10}
       L ${j_x * 10} ${j_y * 10}
       L ${j_x} ${j_y} 
    `);

    console.log(verts);

    boundaries.push(
      Bodies.fromVertices(300, 300, verts, {
        isStatic: true,
        render: { fillStyle: "red" },
      }));
  }
  console.log(boundaries);
  */

  // Create the collectors
  let collectors = [];
  const counterColors = {
    fire: "red",
    water: "blue",
    air: "white",
    earth: "green",
    aether: "purple",
  };
  let bodyToColor = {};
  for (let [counter, point] of Object.entries(counterPoints)) {
    const b = Bodies.circle(point[0], point[1], 90, {
      isStatic: true,
      restitution: 0.5,
      render: {
        fillStyle: counterColors[counter],
      },
    });

    bodyToColor[b.id] = counter;

    collectors.push(b);
  }

  const collectorIds = collectors.map((m) => m.id);

  // Create the boundaries.
  // WIDTH = 800;
  // HEIGHT = 600;
  const ground = Bodies.rectangle(300, 400, 810, 60, {
    isStatic: true,
    restitution: 1.0,
  });

  let dir = [0, 1];
  const updateGravity = (counters) => {
    dir = computeGravity(counters);
    engine.gravity.x = dir[0] * 1.0;
    engine.gravity.y = dir[1] * 1.0;
  };

  // add all of the bodies to the world
  Composite.add(engine.world, [...plinkers, ...collectors]);

  Events.on(engine, "collisionStart", function (event) {
    const pairs = event.pairs;
    let removed = [];
    for (const p of pairs) {
      // TODO: Clean This Up
      if (collectorIds.includes(p.bodyA.id) && !removed.includes(p.bodyB.id)) {
        Composite.remove(engine.world, p.bodyB);
        removed.push(p.bodyB.id);
        kai && kai.incrementCounter(bodyToColor[p.bodyA.id], -1);
      }
      if (collectorIds.includes(p.bodyB.id) && !removed.includes(p.bodyA.id)) {
        Composite.remove(engine.world, p.bodyA);
        removed.push(p.bodyA.id);
        kai && kai.incrementCounter(bodyToColor[p.bodyB.id], -1);
      }
    }
  });

  Events.on(render, "afterRender", () => {
    const ctx = render.context;

    // Render the status of the connection.
    ctx.save();
    ctx.font = "12px serif";
    ctx.strokeStyle = "black";
    ctx.fillText(
      `Connection Status: ${kai ? "Connected" : "Not Connected"}`,
      40,
      40
    );

    // draw the arrow of gravity!
    /*
    ctx.lineWidth = 10;
    ctx.strokeStyle = "steelblue";
    ctx.fillStyle = "steelbllue"; // for the triangle fill
    ctx.lineJoin = "butt";

    ctx.beginPath();

    ctx.moveTo(300, 300);
    ctx.lineTo(300 + dir[0] * 200, 300 + dir[1] * 200);
    ctx.stroke();
    */
    ctx.restore();
  });

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  const connectKai = async () => {
    if (kai) return;

    try {
      kai = await Kai.createForBrowser();
      kai.on("any", (counters) => {
        updateGravity(counters);
      });
      updateGravity(kai.getCounters());
    } catch (error) {}
  };

  setInterval(() => {
    connectKai();
  }, 1000);

  // run the engine
  Runner.run(runner, engine);
})();
