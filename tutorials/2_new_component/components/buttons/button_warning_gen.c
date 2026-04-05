/**
 * @file button_warning_gen.c
 * @brief Template source file for LVGL objects
 */

/*********************
 *      INCLUDES
 *********************/

#include "button_warning_gen.h"
#include "../../ui_new_component.h"

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

lv_obj_t * button_warning_create(lv_obj_t * parent, const char * label_text)
{
    LV_TRACE_OBJ_CREATE("begin");

    lv_obj_t * button_normal_0 = button_normal_create(parent, label_text);
    lv_obj_set_name_static(button_normal_0, "button_warning_#");
    lv_obj_set_style_bg_color(button_normal_0, YELLOW, 0);

    LV_TRACE_OBJ_CREATE("finished");

    return button_normal_0;
}

/**********************
 *   STATIC FUNCTIONS
 **********************/

