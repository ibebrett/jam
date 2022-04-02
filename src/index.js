import { Kai } from "@kaimerra-corp/kai-api/dist/index";
import { Engine, Render, Runner, Bodies, Composite } from "matter-js";

(async () => {
  const kai = await Kai.createForBrowser();

  // create an engine
  const engine = Engine.create();

  // create a renderer
  const render = Render.create({
    element: document.body,
    engine: engine,
  });

  // create two boxes and a ground
  const boxA = Bodies.circle(400, 50, 20);
  const boxB = Bodies.rectangle(400, 200, 80, 80);
  const ground = Bodies.rectangle(400, 600, 810, 60, { isStatic: true });
  const cieling = Bodies.rectangle(400, 10, 810, 60, { isStatic: true });

  // add all of the bodies to the world
  Composite.add(engine.world, [boxA, boxB, ground, cieling]);

  // run the renderer
  Render.run(render);

  // create runner
  const runner = Runner.create();

  kai.on("any", (counters) => {
    const air = counters.get("air");
    const earth = counters.get("earth");
    engine.gravity.y = (earth - air) / air;
  });

  // run the engine
  Runner.run(runner, engine);
})();
