import { describe, it, expect } from "vitest";
import { buildChatRequest, buildItineraryRequest, buildAddPlaceRequest } from "../api/_prompts.js";
import { getDestinationById } from "../src/data/destinations.js";

const kyoto = getDestinationById("kyoto");

describe("server-side prompt builders", () => {
  it("chat prompt includes the identity guard and treats traveler text as untrusted", () => {
    const { systemInstruction, contents } = buildChatRequest({ destination: kyoto, question: "When to visit?", history: [] });
    expect(systemInstruction).toContain("Meridian's travel assistant");
    expect(systemInstruction).toContain("untrusted data");
    expect(contents.at(-1)).toEqual({ role: "user", parts: [{ text: "When to visit?" }] });
  });

  it("chat history keeps its roles and order, with the new question last", () => {
    const { contents } = buildChatRequest({
      destination: kyoto,
      question: "Next?",
      history: [{ role: "user", text: "Hi" }, { role: "model", text: "Hello" }],
    });
    expect(contents.map((c) => c.role)).toEqual(["user", "model", "user"]);
  });

  it("itinerary request asks for JSON and carries the traveler's constraints", () => {
    const request = buildItineraryRequest({
      destination: kyoto,
      days: 4,
      interests: ["Food"],
      pace: "Relaxed",
      budget: "120",
      mustVisit: ["Kinkaku-ji"],
      dietary: ["Vegan", "Halal"],
      travelStyle: ["Senior-friendly"],
    });
    expect(request.responseMimeType).toBe("application/json");
    expect(request.systemInstruction).toContain("Vegan, Halal");
    expect(request.systemInstruction).toContain("Kinkaku-ji");
    expect(request.contents[0].parts[0].text).toContain("Trip length: 4 days");
  });

  it("omits optional sections when they are empty", () => {
    const { systemInstruction } = buildItineraryRequest({
      destination: kyoto, days: 1, interests: [], pace: "Balanced", budget: "", mustVisit: [], dietary: [], travelStyle: [],
    });
    expect(systemInstruction).not.toContain("Dietary needs");
    expect(systemInstruction).not.toContain("daily budget");
  });

  it("add-place request is JSON and embeds the current itinerary", () => {
    const days = [{ title: "Day 1", activities: [] }];
    const request = buildAddPlaceRequest({ destination: kyoto, placeName: "Nishiki Market", days });
    expect(request.responseMimeType).toBe("application/json");
    expect(request.contents[0].parts[0].text).toContain("Nishiki Market");
    expect(request.contents[0].parts[0].text).toContain(JSON.stringify(days));
  });
});
