const express = require("express");
const router = express.Router();
const Playlist = require("../models/Playlist");
const { body, validationResult } = require("express-validator");
const fetchuser = require("../middleware/fetchUser");

// Route 1: Fetch all playlists of a user using: GET "/api/playlists/". Login required
router.get("/", fetchuser, async (req, res) => {
  const playlists = await Playlist.find({ user: req.user.id });
  res.json(playlists);
});

// Route 2: Add a new playlist using: POST "/api/playlists/new-playlist". Login required
router.post(
  "/new-playlist",
  fetchuser,
  [
    body("title", "Please enter a valid title").isLength({ min: 3 }),
    body("description", "Description must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // If there are errors, return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, description} = req.body;
      const playlist = new Playlist({
        title,
        description,
        user: req.user.id,
      });
      const savedPlaylist = await playlist.save();
      res.json(savedPlaylist);
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error Occured");
    }
  }
);

// Route 3: Update an existing note using: PUT "/api/playlists/update". Login required
router.put("/update/:id", fetchuser, async (req, res) => {
  try {
    const { title, description } = req.body;
    // Create a newNote object
    const newPlaylist = {};
    if (title) {
      newPlaylist.title = title;
    } 
    if (description) {
      newPlaylist.description = description;
    }

    // Find the note to be updated and update it
    let playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).send("Not Found");
    }

    if (playlist.user.toString() != req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { $set: newPlaylist },
      { new: true }
    );
    res.json({ playlist });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error Occured");
  }
});

// Route 4: DELETE an existing playlist using: DELETE "/api/playlists/delete-playlist". Login required
router.delete("/delete-playlist/:id", fetchuser, async (req, res) => {
  try {
    // Find the note to be deleted and delete it
    let playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).send("Not Found");
    }

    // Allow deletion only if user owns this Playlist
    if (playlist.user.toString() != req.user.id) {
      return res.status(401).send("Not Allowed");
    }

    playlist = await playlist.findByIdAndDelete(req.params.id);
    res.json({ Success: "Your playlist has been deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error Occured");
  }
});

module.exports = router;