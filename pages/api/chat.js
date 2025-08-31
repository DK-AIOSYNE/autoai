import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  console.log("API Key Mistral:", process.env.MISTRAL_API_KEY ? "OK" : "undefined");

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { question, historique } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question invalide' });
  }

  // Compter combien de messages "Moi:" il y a (y compris le message courant)
  const userMessagesCount = (historique.match(/Moi:/g) || []).length + 1;

  if (userMessagesCount > 10) {
