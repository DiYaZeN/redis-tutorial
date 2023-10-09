import express from "express";
import * as Redis from "redis";
import axios from "axios";
import cors from "cors";

const DEFAULT_EXPIRATION = 3600;

const redisClient = Redis.createClient();
redisClient
  .connect()
  .then(() => {
    console.log("Redis successfully connected");
  })
  .catch((err) => {
    console.log("Redis failed to connect", err);
    process.exit();
  });

const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;
  const cachedPhotos = await redisClient.get("photos");
  if (cachedPhotos !== null) {
    console.log("Serving from cache");
    res.json(JSON.parse(cachedPhotos));
  } else {
    console.log("Serving from API");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    redisClient.setEx("photos", DEFAULT_EXPIRATION, JSON.stringify(data));
    res.json(data);
  }
});

app.get("/photos/:id", async (req, res) => {
  const id = req.params.id;
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${id}`
  );
  res.json(data);
});

app.listen(3003, () => {
  console.log("Server listening on port 3003");
});
