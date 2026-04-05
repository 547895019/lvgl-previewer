/**
 * @file ui_assets_gen.c
 */

/*********************
 *      INCLUDES
 *********************/

#include "ui_assets_gen.h"

#if LV_USE_XML
#endif /* LV_USE_XML */

/*********************
 *      DEFINES
 *********************/

/**********************
 *      TYPEDEFS
 **********************/

/**********************
 *  STATIC PROTOTYPES
 **********************/

/**********************
 *  STATIC VARIABLES
 **********************/

/*----------------
 * Translations
 *----------------*/

/**********************
 *  GLOBAL VARIABLES
 **********************/

/*--------------------
 *  Permanent screens
 *-------------------*/

/*----------------
 * Fonts
 *----------------*/

lv_font_t * montserrat_14_c_array;
extern lv_font_t montserrat_14_c_array_data;
lv_font_t * montserrat_16_bin_file;
extern lv_font_t montserrat_16_bin_file_data;
lv_font_t * montserrat_18_tiny_ttf_data;
extern uint8_t Montserrat_Medium_ttf_data[];
extern size_t Montserrat_Medium_ttf_data_size;
lv_font_t * montserrat_20_tiny_ttf_file;

/*----------------
 * Images
 *----------------*/

const void * flower_data;
extern const void * flower_data_data;
const void * flower_file;

/*----------------
 * Global styles
 *----------------*/

/*----------------
 * Subjects
 *----------------*/

/**********************
 *      MACROS
 **********************/

/**********************
 *   GLOBAL FUNCTIONS
 **********************/

void ui_assets_init_gen(const char * asset_path)
{
    char buf[256];


    /*----------------
     * Fonts
     *----------------*/

    /* get font 'montserrat_14_c_array' from a C array */
    montserrat_14_c_array = &montserrat_14_c_array_data;
    /* get font 'montserrat_16_bin_file' from a C array */
    montserrat_16_bin_file = &montserrat_16_bin_file_data;
    /* create tiny ttf font 'montserrat_18_tiny_ttf_data' from C array */
    montserrat_18_tiny_ttf_data = lv_tiny_ttf_create_data(Montserrat_Medium_ttf_data, Montserrat_Medium_ttf_data_size, 18);
    /* create tiny ttf font "montserrat_20_tiny_ttf_file" from file */
    lv_snprintf(buf, 256, "%s%s", asset_path, "fonts/Montserrat_Medium.ttf");
    montserrat_20_tiny_ttf_file = lv_tiny_ttf_create_file(buf, 20);


    /*----------------
     * Images
     *----------------*/
    flower_data = &flower_data_data;
    lv_snprintf(buf, 256, "%s%s", asset_path, "images/orange-flower.png");
    flower_file = lv_strdup(buf);

    /*----------------
     * Global styles
     *----------------*/

    /*----------------
     * Subjects
     *----------------*/
    /*----------------
     * Translations
     *----------------*/

#if LV_USE_XML
    /* Register widgets */

    /* Register fonts */
    lv_xml_register_font(NULL, "montserrat_14_c_array", montserrat_14_c_array);
    lv_xml_register_font(NULL, "montserrat_16_bin_file", montserrat_16_bin_file);
    lv_xml_register_font(NULL, "montserrat_18_tiny_ttf_data", montserrat_18_tiny_ttf_data);
    lv_xml_register_font(NULL, "montserrat_20_tiny_ttf_file", montserrat_20_tiny_ttf_file);

    /* Register subjects */

    /* Register callbacks */
#endif

    /* Register all the global assets so that they won't be created again when globals.xml is parsed.
     * While running in the editor skip this step to update the preview when the XML changes */
#if LV_USE_XML && !defined(LV_EDITOR_PREVIEW)
    /* Register images */
    lv_xml_register_image(NULL, "flower_data", flower_data);
    lv_xml_register_image(NULL, "flower_file", flower_file);
#endif

#if LV_USE_XML == 0
    /*--------------------
     *  Permanent screens
     *-------------------*/
    /* If XML is enabled it's assumed that the permanent screens are created
     * manaully from XML using lv_xml_create() */
#endif
}

/* Callbacks */

/**********************
 *   STATIC FUNCTIONS
 **********************/