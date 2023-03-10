window.addEventListener("load", function () {
  const canvas = document.querySelector("#canvas1");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.95;
  let topPos = canvas.getBoundingClientRect().top + window.scrollY;
  let leftPos = canvas.getBoundingClientRect().left + window.scrollX;
  let mouseX = leftPos;
  let mouseY = topPos;

  const colors = ["green", "yellow", "orange", "red"];
  const pairs = { 3: 1, 2: 2, 1: 3 };

  function radian(degree) {
    return (degree * Math.PI) / 180;
  }

  function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  class InputHandler {
    constructor(game, context) {
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
        if (e.key === "m") {
          this.game.movementType =
            this.game.movementType === this.game.movementTypes.Absolute
              ? this.game.movementTypes.Relative
              : this.game.movementTypes.Absolute;
        }
      });
      window.addEventListener("click", (e) => {
        this.game.player.shoot();
      });
      window.addEventListener("keyup", (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
      window.addEventListener("mousemove", (e) => {
        mouseX = e.clientX - leftPos;
        mouseY = e.clientY - topPos;
      });
    }
  }

  class Projectile {
    constructor(game, x, y, angle) {
      this.game = game;
      this.width = 4;
      this.height = this.width;
      this.x = x;
      this.y = y;
      this.speed = 6;
      this.angle = angle;
      this.markedForDeletion = false;
    }
    update() {
      this.x += this.speed * Math.cos(this.angle);
      this.y += this.speed * Math.sin(this.angle);
      if (
        this.x > this.game.width ||
        this.x < 0 ||
        this.y > this.game.height ||
        this.y < 0
      ) {
        this.markedForDeletion = true;
      }
    }
    draw(context) {
      context.save();
      context.fillStyle = "black";
      context.beginPath();
      context.arc(this.x, this.y, this.width, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
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
      this.speed = 5;
      this.minSpeed = -5;
      this.maxSpeed = 5;
      this.projectiles = [];
      this.angle = 0;
      this.aimTriangle = 35;
      this.aimTriangleSideways = 25;
      this.lives = 3;
      this.score = 0;
      this.ammo = 10;
      this.maxAmmo = 20;
      this.ammoInterval = 500;
      this.ammoTimer = 0;
    }
    update(deltaTime) {
      this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
      //movement
      if (this.game.movementType === this.game.movementTypes.Relative) {
        this.moveRelative();
      } else if (this.game.movementType === this.game.movementTypes.Absolute) {
        this.moveAbsolute();
      }
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
      //refill ammo
      if (this.ammoTimer > this.ammoInterval) {
        if (this.ammo < this.maxAmmo) this.addAmmo(1);
        this.ammoTimer = 0;
      } else {
        this.ammoTimer += deltaTime;
      }
    }
    draw(context) {
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
      this.drawPlayerModel(context);
    }
    drawPlayerModel(context) {
      context.save();
      //triangle tip pointing towards cursor
      context.fillStyle = "black";
      context.beginPath();
      context.moveTo(this.x, this.y);
      context.lineTo(
        this.x + this.aimTriangleSideways * Math.cos(this.angle + radian(90)),
        this.y + this.aimTriangleSideways * Math.sin(this.angle + radian(90))
      );
      context.lineTo(
        this.x + this.aimTriangle * Math.cos(this.angle),
        this.y + this.aimTriangle * Math.sin(this.angle)
      );
      context.lineTo(
        this.x + this.aimTriangleSideways * Math.cos(this.angle + radian(-90)),
        this.y + this.aimTriangleSideways * Math.sin(this.angle + radian(-90))
      );
      context.fill();
      context.closePath();
      //circle
      context.fillStyle = "grey";
      context.beginPath();
      context.arc(this.x, this.y, this.width, 0, 2 * Math.PI, false);
      context.closePath();
      context.fill();
      context.restore();
    }
    shoot() {
      if (this.ammo >= 1) {
        this.projectiles.push(
          new Projectile(this.game, this.x, this.y, this.angle)
        );
        this.ammo--;
      }
    }
    addAmmo(x) {
      if (this.ammo + x >= this.maxAmmo) this.ammo = this.maxAmmo;
      else this.ammo += x;
    }
    drawLineBetween(context, x1, y1, x2, y2) {
      context.save();
      context.strokeStyle = "red";
      context.lineWidth = 0.5;
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();
      context.restore();
    }
    moveAbsolute() {
      const speedIncrement = 0.25;
      const wPressed = this.game.keys.includes("w");
      const sPressed = this.game.keys.includes("s");
      if (wPressed) {
        this.speedY += -speedIncrement;
      } else if (!sPressed && this.speedY < 0) {
        this.speedY += speedIncrement;
      }
      if (sPressed) {
        this.speedY += speedIncrement;
      } else if (!wPressed && this.speedY > 0) {
        this.speedY += -speedIncrement;
        if (this.speedY < speedIncrement) this.speedY = 0;
      }
      if (this.speedY > this.maxSpeed) this.speedY = this.maxSpeed;
      if (this.speedY < this.minSpeed) this.speedY = this.minSpeed;
      this.y += this.speedY;
      //speedX
      const aPressed = this.game.keys.includes("a");
      const dPressed = this.game.keys.includes("d");
      if (aPressed) {
        this.speedX += -speedIncrement;
      } else if (!dPressed && this.speedX < 0) {
        this.speedX += speedIncrement;
      }
      if (dPressed) {
        this.speedX += speedIncrement;
      } else if (!aPressed && this.speedX > 0) {
        this.speedX += -speedIncrement;
        if (this.speedX < speedIncrement) this.speedX = 0;
      }
      if (this.speedX > this.maxSpeed) this.speedX = this.maxSpeed;
      if (this.speedX < this.minSpeed) this.speedX = this.minSpeed;
      this.x += this.speedX;
    }
    moveRelative() {
      const wPressed = this.game.keys.includes("w");
      const sPressed = this.game.keys.includes("s");
      if (wPressed) {
        this.x += this.speed * Math.cos(this.angle);
        this.y += this.speed * Math.sin(this.angle);
      }
      if (sPressed) {
        this.x -= this.speed * Math.cos(this.angle);
        this.y -= this.speed * Math.sin(this.angle);
      }
      const aPressed = this.game.keys.includes("a");
      const dPressed = this.game.keys.includes("d");
      if (aPressed) {
        this.x += this.speed * Math.cos(this.angle + radian(-90));
        this.y += this.speed * Math.sin(this.angle + radian(-90));
      }
      if (dPressed) {
        this.x += this.speed * Math.cos(this.angle + radian(90));
        this.y += this.speed * Math.sin(this.angle + radian(90));
      }
    }
  }

  class Enemy {
    constructor(game, spawnX, spawnY, speed, lives) {
      this.game = game;
      this.x = spawnX;
      this.y = spawnY;
      this.speed = speed;
      this.width = 40;
      this.height = 40;
      this.lives = lives;
      this.score = this.lives;
      this.markedForDeletion = false;
    }
    update(context) {
      const angle = Math.atan2(
        this.game.player.y - this.y,
        this.game.player.x - this.x
      );
      this.x += this.speed * Math.cos(angle);
      this.y += this.speed * Math.sin(angle);
    }
    draw(context) {
      context.save();
      context.fillStyle = colors[this.lives];
      context.fillRect(this.x, this.y, this.width, this.height);
      context.fillStyle = "black";
      context.fillText(this.lives, this.x, this.y);
      context.restore();
    }
  }

  class UI {
    constructor(game) {
      this.game = game;
      this.fontSize = 25;
      this.fontFamily = "Helvetica";
      this.color = "black";
    }
    draw(context) {
      context.save();
      context.fillStyle = this.color;
      context.shadowOffsetX = 1;
      context.shadowOffsetY = 1;
      context.shadowColor = "white";
      context.font = `${this.fontSize}px ${this.fontFamily}`;
      //player health
      context.fillText(`Health: ${this.game.player.lives}`, 20, 40);
      //player score
      context.fillText(`Score: ${this.game.player.score}`, 20, 70);
      //player ammo
      for (let i = 0; i < this.game.player.ammo; i++) {
        context.fillRect(i * 5 + 30, 100, 3, 20);
      }
      //gameover text
      if (this.game.gameover) {
        context.textAlign = "center";
        context.fillText(
          `Game over!`,
          this.game.width * 0.5,
          this.game.height * 0.5
        );
      }
      context.restore();
    }
  }

  class Game {
    constructor(width, height) {
      this.width = width;
      this.height = height;
      this.movementTypes = {
        Relative: "relative",
        Absolute: "absolute",
      };
      this.movementType = this.movementTypes.Absolute;
      this.keys = [];
      this.player = new Player(this);
      this.input = new InputHandler(this);
      this.ui = new UI(this);
      this.enemies = [];
      this.enemyInterval = 1000;
      this.enemyTimer = 0;
      this.gameover = false;
    }
    update(context, deltaTime) {
      if (this.enemyTimer > this.enemyInterval) {
        const spawnCoords = this.getSpawnCoords();
        const health = getRandomInteger(1, 3);
        this.enemies.push(
          new Enemy(this, spawnCoords.x, spawnCoords.y, pairs[health], health)
        );
        this.enemyTimer = 0;
      } else {
        this.enemyTimer += deltaTime;
      }
      this.player.update(deltaTime);
      this.enemies.forEach((enemy) => {
        enemy.update(context);
        if (this.rectCollision(this.player, enemy)) {
          enemy.markedForDeletion = true;
          this.player.lives -= enemy.score;
          if (this.player.lives <= 0) {
            this.gameover = true;
          }
        }
        this.player.projectiles.forEach((projectile) => {
          if (this.rectCollision(projectile, enemy)) {
            enemy.lives--;
            projectile.markedForDeletion = true;
            if (enemy.lives <= 0) {
              enemy.markedForDeletion = true;
              this.player.score += enemy.score;
              this.player.addAmmo(enemy.score);
            }
          }
        });
      });
      this.enemies = this.enemies.filter((enemy) => !enemy.markedForDeletion);
    }
    draw(context) {
      this.player.draw(context);
      this.enemies.forEach((enemy) => {
        enemy.draw(context);
      });
      this.ui.draw(context);
    }
    rectCollision(r1, r2) {
      return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.height + r1.y > r2.y
      );
    }
    getSpawnCoords() {
      // 1: left, 2: top, 3: right, 4: bottom
      const side = getRandomInteger(1, 4);
      if (side == 1) {
        return { x: 0, y: getRandomInteger(0, canvas.height) };
      } else if (side == 2) {
        return { x: getRandomInteger(0, canvas.width), y: 0 };
      } else if (side == 3) {
        return { x: canvas.width, y: getRandomInteger(0, canvas.height) };
      } else if (side == 4) {
        return { x: getRandomInteger(0, canvas.width), y: canvas.height };
      }
    }
  }

  const game = new Game(canvas.width, canvas.height);
  let lastTime = 0;
  function animate(timeStamp) {
    const deltaTime = timeStamp - lastTime;
    lastTime = timeStamp;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    game.update(ctx, deltaTime);
    game.draw(ctx);
    if (game.gameover) {
      return;
    }
    requestAnimationFrame(animate);
  }
  animate(0);
});
