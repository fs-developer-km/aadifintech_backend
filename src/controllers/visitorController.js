import { v4 as uuidv4 } from "uuid";
import { Visitor } from "../models/visitorModel.js";

export const trackVisitor = async (req, res) => {
  try {
    const visitor = new Visitor({
      visitorId: uuidv4(),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      pageVisited: req.body.pageVisited || "Homepage"
    });

    await visitor.save();
    res.status(201).json({ success: true, message: "Visitor tracked", visitor });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching visitors" });
  }
};
