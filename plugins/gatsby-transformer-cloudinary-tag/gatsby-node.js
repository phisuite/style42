const fs = require("fs-extra")
const {
  getFixedImageObject,
  getFluidImageObject,
} = require("./getImageObjects")
const { uploadImageNodeToCloudinary } = require("./upload")
const { fetchPictures } = require("./fetchPictures")

const { createFilePath } = require(`gatsby-source-filesystem`)

const ALLOWED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/gif"]

exports.onPreExtractQueries = async ({ store, getNodesByType }) => {
  const program = store.getState().program
  // Check if there are any ImageSharp nodes. If so add fragments for ImageSharp.
  // The fragment will cause an error if there are no ImageSharp nodes.
  if (getNodesByType(`CloudinaryAsset`).length == 0) {
    return
  }

  // We have CloudinaryAsset nodes so let’s add our fragments to .cache/fragments.
  await fs.copy(
    require.resolve(`./fragments.js`),
    `${program.directory}/.cache/fragments/cloudinary-asset-fragments.js`,
  )
}

exports.createSchemaCustomization = ({ actions }) => {
  actions.createTypes(`
    type CloudinaryAsset implements Node @dontInfer {
      tags: [String!]
      fixed(
        base64Width: Int
        base64Transformations: [String!]
        chained: [String!]
        transformations: [String!]
        width: Int
      ): CloudinaryAssetFixed!
      fluid(
        base64Width: Int
        base64Transformations: [String!]
        chained: [String!]
        maxWidth: Int
        transformations: [String!]
      ): CloudinaryAssetFluid!
    }
    type CloudinaryAssetFixed {
      aspectRatio: Float
      base64: String!
      height: Float
      src: String
      srcSet: String
      width: Float
    }
    type CloudinaryAssetFluid {
      aspectRatio: Float!
      base64: String!
      sizes: String!
      src: String!
      srcSet: String!
    }
  `)
}

exports.createResolvers = ({ createResolvers, reporter }) => {
  const resolvers = {
    // Query: {
    //   allTheAssets: {
    //     type: `CloudinaryAsset`,
    //     resolve(source, args, context, info) {
    //       console.log(source)
    //     }
    //   }
    // },
    cloudinaryAsset: {
      fixed: {
        type: "CloudinaryAssetFixed!",
        resolve: (
          { public_id, version, cloudName, originalHeight, originalWidth },
          {
            base64Width,
            base64Transformations,
            width,
            transformations,
            chained,
          },
        ) =>
          getFixedImageObject({
            public_id,
            version,
            cloudName,
            originalHeight,
            originalWidth,
            width,
            base64Width,
            base64Transformations,
            transformations,
            chained,
          }),
      },
      fluid: {
        type: "CloudinaryAssetFluid!",
        resolve: (
          {
            public_id,
            version,
            cloudName,
            originalHeight,
            originalWidth,
            breakpoints,
          },
          {
            base64Width,
            base64Transformations,
            maxWidth,
            transformations,
            chained,
          },
        ) =>
          getFluidImageObject({
            public_id,
            version,
            cloudName,
            maxWidth,
            breakpoints,
            originalHeight,
            originalWidth,
            base64Width,
            base64Transformations,
            transformations,
            chained,
          }),
      },
    },
  }

  createResolvers(resolvers)
}

exports.sourceNodes = async ({ actions: { createNode }, createNodeId, createContentDigest, reporter }, options) => {

  // 1. fetch images from cloudinary
  const pictures = await fetchPictures(options)
  // console.log("list",list)

  // 2. uploadImage (overwrite = false) on cloudinary with breakpoints and stuff
  const results = await Promise.all(pictures.map(picture => uploadImageNodeToCloudinary(picture, options).catch(
    error => reporter.panic(error.message, error),
  )))

  // 3. get update image list

  // 4. create Nodes for each image
  return Promise.all(results.filter(r => !!r).map(result =>
      createNode({
        cloudName: options.cloudName,
        id: createNodeId(`my-data-${result.public_id}`),
        public_id: result.public_id,
        originalHeight: result.height,
        originalWidth: result.width,
        breakpoints: result.responsive_breakpoints.map(({ width }) => width),
        parent: ,
        children: [],
        internal: {
          type: `CloudinaryAsset`,
          mediaType: `text/html`,
          content: JSON.stringify(result),
          contentDigest: createContentDigest(result),
        },
      }),
    ),
  )
}


// todo: kill this
// // exports.onCreateNode = async (
// //   { node, actions, reporter, createNodeId },
// //   options,
// // ) => {
// //   if (!ALLOWED_MEDIA_TYPES.includes(node.internal.mediaType)) {
// //     return
// //   }
// //
// //   const result = await uploadImageNodeToCloudinary(node, options).catch(
// //     error => {
// //       reporter.panic(error.message, error)
// //     },
// //   )
// //
// //   const [{ breakpoints }] = result.responsive_breakpoints
// //
// //   const imageNode = {
// //     // These helper fields are only here so the resolvers have access to them.
// //     // They will *not* be available via Gatsby’s data layer.
// //     cloud_name: options.cloudName,
// //     api_key: options.apiKey,
// //     api_secret: options.apiSecret,
// //     public_id: result.public_id,
// //     version: result.version,
// //     originalHeight: result.height,
// //     originalWidth: result.width,
// //     breakpoints: breakpoints.map(({ width }) => width),
// //
// //     // Add the required internal Gatsby node fields.
// //     id: createNodeId(`CloudinaryAsset-${node.id}`),
// //     parent: node.id,
// //     internal: {
// //       type: "CloudinaryAsset",
// //       // Gatsby uses the content digest to decide when to reprocess a given
// //       // node. We can use the parent file’s digest to avoid doing extra work.
// //       contentDigest: node.internal.contentDigest,
// //     },
// //   }
// //
// //   // Add the new node to Gatsby’s data layer.
// //   actions.createNode(imageNode)
// //
// //   // Tell Gatsby to add `childCloudinaryAsset` to the parent `File` node.
// //   actions.createParentChildLink({ parent: node, child: imageNode })
// }