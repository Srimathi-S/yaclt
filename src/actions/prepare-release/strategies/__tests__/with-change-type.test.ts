import { WithChangeTypeStrategy } from "../with-change-type";
import Handlebars from "handlebars";

const mockFn = jest.fn();
jest.mock("../../../../utils/template-utils", () => ({
  compileTemplate: jest.fn(() => mockFn),
}));
describe("WithChangeTypeStrategy", () => {
  let withChangeTypeStrategy: WithChangeTypeStrategy;
  const IMPROVED = "IMPROVED";
  const NEW = "NEW";
  const improvedMsg = "IMPROVED -m message";
  describe("processLine", () => {
    beforeEach(() => {
      const template = IMPROVED;
      const options: CompileOptions = { noEscape: true, strict: true };
      const record = Handlebars.compile(template, options);
      withChangeTypeStrategy = new WithChangeTypeStrategy(record, [
        IMPROVED,
        NEW,
      ]);
    });

    it("should create and add entry in case it finds proper template", () => {
      withChangeTypeStrategy.processLine(improvedMsg);

      expect(Reflect.get(withChangeTypeStrategy, "entryGroups")).toEqual([
        { items: [improvedMsg], label: IMPROVED },
      ]);
    });

    it("should add entry to same label in case it finds proper template and label already exists", () => {
      withChangeTypeStrategy.processLine(improvedMsg);
      withChangeTypeStrategy.processLine("IMPROVED -m new message");

      expect(Reflect.get(withChangeTypeStrategy, "entryGroups")).toEqual([
        {
          items: [improvedMsg, "IMPROVED -m new message"],
          label: IMPROVED,
        },
      ]);
    });

    it("should throw error when changetype exists but cannot find template for the same", () => {
      expect(() =>
        withChangeTypeStrategy.processLine("NEW -m message")
      ).toThrow("unable to parse change type");

      expect(Reflect.get(withChangeTypeStrategy, "entryGroups")).toEqual([]);
    });

    it("should throw parsing error and should not add in case it doesn't find proper template", () => {
      expect(() =>
        withChangeTypeStrategy.processLine("SUCCESS -m message")
      ).toThrow("unable to parse change type");

      expect(Reflect.get(withChangeTypeStrategy, "entryGroups")).toEqual([]);
    });
  });

  describe("generate", () => {
    beforeEach(() => {
      const template = "IMPROVED";
      const options: CompileOptions = { noEscape: true, strict: true };
      const record = Handlebars.compile(template, options);
      withChangeTypeStrategy = new WithChangeTypeStrategy(record, [
        "IMPROVED",
        "NEW",
      ]);
      mockFn.mockClear();
    });

    it("should call compileTemplate result with label item and release number if entry exist", () => {
      withChangeTypeStrategy.processLine(improvedMsg);

      withChangeTypeStrategy.generate(IMPROVED, "1");
      expect(mockFn).toHaveBeenCalledWith({
        entryGroups: [{ items: [improvedMsg], label: IMPROVED }],
        releaseNumber: "1",
      });
    });

    it("should call compileTemplate result with empty entrygroup and release number if entry does not exist but template exists", () => {
      withChangeTypeStrategy.generate(IMPROVED, "1");

      expect(mockFn).toHaveBeenCalledWith({
        entryGroups: [],
        releaseNumber: "1",
      });
    });

    it("should call compileTemplate result with empty entrygroup and release number if entry and template does not exist", () => {
      withChangeTypeStrategy.generate("SUCCESS", "1");

      expect(mockFn).toHaveBeenCalledWith({
        entryGroups: [],
        releaseNumber: "1",
      });
    });
  });
});
