module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("favicon.svg");
  eleventyConfig.addPassthroughCopy("og-image.png");

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes"
    }
  };
};