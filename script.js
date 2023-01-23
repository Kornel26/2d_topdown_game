window.addEventListener("load", function () {
  const canvas = document.querySelector("#canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth * 0.75;
  canvas.height = window.innerHeight * 0.75;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener("keydown", (e) => {
        if (
          (e.key === "a" || e.key === "d" || e.key === "w" || e.key === "s") &&
          this.game.keys.indexOf(e.key) === -1
        ) {
          this.game.keys.push(e.key);
        }
        if (e.key === " ") {
          this.game.player.shoot();
        }
      });
      window.addEventListener("keyup", (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
    }
  }

  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 3;
      this.speed = 3;
      this.markedForDeletion = false;
    }
    update() {
      this.x += this.speed;
      if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
    }
    draw(context) {
      context.save();
      context.fillStyle = "#006600";
      context.fillRect(this.x, this.y, this.width, this.height);
      context.restore();
    }
  }

  class Player {
    constructor(game) {
      this.game = game;
      this.width = 25;
      this.height = 25;
      this.x = canvas.width / 2;
      this.y = canvas.height / 2;
      this.speedY = 0;
      this.speedX = 0;
      this.speedIncrement = 0.1;
      this.minSpeed = -5;
      this.maxSpeed = 5;
      this.projectiles = [];
    }
    update() {
      //speedY
      const wPressed = this.game.keys.includes("w");
      const sPressed = this.game.keys.includes("s");
      if (wPressed) {
        this.speedY += -this.speedIncrement;
      } else if (!sPressed && this.speedY < 0) {
        this.speedY += this.speedIncrement;
      }
      if (sPressed) {
        this.speedY += this.speedIncrement;
      } else if (!wPressed && this.speedY > 0) {
        this.speedY += -this.speedIncrement;
        if (this.speedY < this.speedIncrement) this.speedY = 0;
      }
      if (this.speedY > this.maxSpeed) this.speedY = this.maxSpeed;
      if (this.speedY < this.minSpeed) this.speedY = this.minSpeed;
      this.y += this.speedY;
      //speedX
      const aPressed = this.game.keys.includes("a");
      const dPressed = this.game.keys.includes("d");
      if (aPressed) {
        this.speedX += -this.speedIncrement;
      } else if (!dPressed && this.speedX < 0) {
        this.speedX += this.speedIncrement;
      }
      if (dPressed) {
        this.speedX += this.speedIncrement;
      } else if (!aPressed && this.speedX > 0) {
        this.speedX += -this.speedIncrement;
        if (this.speedX < this.speedIncrement) this.speedX = 0;
      }
      if (this.speedX > this.maxSpeed) this.speedX = this.maxSpeed;
      if (this.speedX < this.minSpeed) this.speedX = this.minSpeed;
      this.x += this.speedX;
      //handle vertical boundries
      if (this.y > this.game.height - this.height * 0.5) {
        this.y = this.game.height - this.height * 0.5;
      } else if (this.y < -this.height * 0.5) {
        this.y = -this.height * 0.5;
      }
      //handle horizontal boundries
      if (this.x > this.game.width - this.width * 0.5) {
        this.x = this.game.width - this.width * 0.5;
      } else if (this.x < -this.width * 0.5) {
        this.x = -this.width * 0.5;
      }
      //handle projectiles
      this.projectiles.forEach((projectile) => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
    }
    draw(context) {
      context.save();
      //context.fillRect(this.x, this.y, this.width, this.height); //rectangle player
      context.fillStyle = "black";
      context.beginPath();
      context.arc(this.x, this.y, this.width, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
      context.restore();
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
    }
    shoot() {
      this.projectiles.push(new Projectile(this.game, this.x, this.y));
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.keys = [];
    }
    update(deltaTime) {
      this.player.update();
    }
    draw(context) {
      this.player.draw(context);
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    //console.log(deltaTime);
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(deltaTime);
    game.draw(ctx);
    requestAnimationFrame(animate);
  }
  animate(0);
});

