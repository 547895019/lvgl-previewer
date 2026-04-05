/**
 * @file screen_translations_gen.c
 * @brief Template source file for LVGL objects
 */

/*********************
 *      INCLUDES
 *********************/

#include "screen_translations_gen.h"
#include "../ui_translations.h"

/*********************
 *      DEFINES
 *********************/

/**********************
 *      TYPEDEFS
 **********************/

/***********************
 *  STATIC VARIABLES
 **********************/

/***********************
 *  STATIC PROTOTYPES
 **********************/

/**********************
 *   GLOBAL FUNCTIONS
 **********************/

lv_obj_t * screen_translations_create(void)
{
    LV_TRACE_OBJ_CREATE("begin");


    static bool style_inited = false;

    if (!style_inited) {

        style_inited = true;
    }

    lv_obj_t * lv_obj_0 = lv_obj_create(NULL);
    lv_obj_set_name_static(lv_obj_0, "screen_translations_#");
    lv_obj_set_flex_flow(lv_obj_0, LV_FLEX_FLOW_COLUMN);
    lv_obj_set_style_text_font(lv_obj_0, montserrat_14, 0);

    lv_obj_t * lv_label_0 = lv_label_create(lv_obj_0);
    lv_label_set_translation_tag(lv_label_0, "dog");
    
    lv_obj_t * lv_label_1 = lv_label_create(lv_obj_0);
    lv_label_set_translation_tag(lv_label_1, "cat");
    
    lv_obj_t * lv_label_2 = lv_label_create(lv_obj_0);
    lv_label_set_translation_tag(lv_label_2, "house");
    
    lv_obj_t * lv_label_3 = lv_label_create(lv_obj_0);
    lv_label_set_translation_tag(lv_label_3, "person");

    LV_TRACE_OBJ_CREATE("finished");

    return lv_obj_0;
}

/**********************
 *   STATIC FUNCTIONS
 **********************/

