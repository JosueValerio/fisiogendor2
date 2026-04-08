import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
Você é o Agente KinesioFlow, um assistente virtual especializado para clínicas de fisioterapia.
Seu objetivo é ajudar pacientes a agendar consultas, responder dúvidas sobre tratamentos (como LCA, Hérnia de Disco, Dry Needling, etc.) e fornecer orientações básicas de saúde.

Diretrizes:
1. Tom de Voz: Empático, profissional e clínico.
2. Seja conciso e direto.
3. Sempre encoraje o paciente a seguir as orientações do fisioterapeuta responsável.
4. Se o paciente perguntar sobre agendamento, verifique a disponibilidade (simulada por enquanto) e peça os dados necessários (Nome, Telefone, Motivo da consulta).
5. Nunca dê diagnósticos definitivos; sempre use termos como "possível", "sugestivo" e recomende avaliação presencial.

Contexto da Clínica:
- Nome: KinesioFlow Clinic
- Especialidades: Fisioterapia Esportiva, Traumato-Ortopedia, Reabilitação Neuromuscular.
- Horário: Segunda a Sexta, das 08:00 às 20:00.
`;

export async function generateAIResponse(message: string, history: { role: 'user' | 'model', text: string }[] = []) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, estou passando por uma instabilidade técnica momentânea. Por favor, tente novamente em instantes.";
  }
}

export async function analyzePatientMessage(message: string) {
  const prompt = `
    Analise a seguinte mensagem de um paciente e extraia intenções em formato JSON:
    Mensagem: "${message}"
    
    Retorne um JSON com:
    - intent: "booking" | "question" | "cancellation" | "other"
    - urgency: "low" | "medium" | "high"
    - summary: um resumo curto da solicitação
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis Error:", error);
    return null;
  }
}
